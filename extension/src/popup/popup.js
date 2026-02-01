// Popup script to display current site privacy score
let currentDomain = ''
let storageListener = null
const BACKEND_URL = 'https://tracely-backend.onrender.com/api'

document.addEventListener('DOMContentLoaded', async () => {
  try {
    // Clear any previous listeners
    if (storageListener) {
      chrome.storage.onChanged.removeListener(storageListener)
    }

    const [activeTab] = await chrome.tabs.query({ active: true, currentWindow: true })
    
    if (!activeTab || !activeTab.url) {
      showNoData()
      return
    }
    
    const url = new URL(activeTab.url)
    currentDomain = url.hostname

    console.log(`[Tracely] Loading data for domain: ${currentDomain}`)

    // Try to fetch from backend API first
    try {
      showLoading()
      const response = await fetch(`${BACKEND_URL}/site/${currentDomain}/score`)
      if (response.ok) {
        const apiData = await response.json()
        console.log(`[Tracely] Backend data for ${currentDomain}:`, apiData)
        if (apiData.data && apiData.data.trackerCount > 0) {
          // Calculate score from tracker data to ensure consistency (new formula: sqrt-based)
          const { trackerCount, thirdPartyCount = 0, cookieCount = 0 } = apiData.data
          const calculatedScore = 
            (Math.sqrt(trackerCount) * 5) +
            (Math.log(Math.max(thirdPartyCount, 1)) * 4) +
            (Math.sqrt(Math.max(cookieCount, 0)) * 1.5)
          const score = Math.min(Math.round(calculatedScore), 100)
          
          // Override score if backend had 0 but trackers exist
          if (apiData.data.score === 0 && trackerCount > 0) {
            console.log(`[Tracely] Backend score was 0 but ${trackerCount} trackers found, recalculating to ${score}`)
            apiData.data.score = score
            apiData.data.riskLevel = score >= 81 ? 'high' : score >= 61 ? 'medium' : 'low'
          }
          
          displaySiteScore(apiData.data)
          console.log('[Tracely] Using backend API data (authoritative)')
        } else {
          loadLocalData()
        }
      } else {
        console.log('[Tracely] Backend API failed, falling back to local storage')
        loadLocalData()
      }
    } catch (err) {
      console.log('[Tracely] Backend unreachable, using local storage:', err)
      loadLocalData()
    }

    // Listen for storage updates as fallback
    storageListener = (changes, areaName) => {
      if (areaName === 'local') {
        const siteDataKey = `site:${currentDomain}`
        if (changes[siteDataKey]) {
          console.log(`[Tracely] Local storage updated for ${currentDomain}`)
          displaySiteScore(changes[siteDataKey].newValue)
        }
      }
    }
    chrome.storage.onChanged.addListener(storageListener)
  } catch (err) {
    console.error('Error initializing popup:', err)
    showNoData()
  }
})

function loadLocalData() {
  // Get site data from storage for THIS domain only
  chrome.storage.local.get([`site:${currentDomain}`], (result) => {
    const siteData = result[`site:${currentDomain}`]
    
    console.log(`[Tracely] Local storage data for ${currentDomain}:`, siteData)

    if (!siteData || siteData.trackerCount === 0) {
      showNoData()
    } else {
      // Recalculate score if it's 0 but trackers exist (fixes stale cache)
      if (siteData.score === 0 && siteData.trackerCount > 0) {
        const { trackerCount, thirdPartyCount = 0, cookieCount = 0 } = siteData
        const calculatedScore = 
          (Math.sqrt(trackerCount) * 5) +
          (Math.log(Math.max(thirdPartyCount, 1)) * 4) +
          (Math.sqrt(Math.max(cookieCount, 0)) * 1.5)
        siteData.score = Math.min(Math.round(calculatedScore), 100)
        siteData.riskLevel = siteData.score >= 81 ? 'high' : siteData.score >= 61 ? 'medium' : 'low'
        console.log(`[Tracely] Recalculated local score from 0 to ${siteData.score}`)
      }
      
      displaySiteScore(siteData)
      console.log('[Tracely] Using local storage data')
    }
  })
}

function showLoading() {
  const loadingEl = document.getElementById('loading-spinner')
  const noDataEl = document.getElementById('no-data')
  if (loadingEl) loadingEl.style.display = 'block'
  if (noDataEl) noDataEl.textContent = 'Analyzing site privacy...'
}

function showNoData() {
  const loadingEl = document.getElementById('loading-spinner')
  const noDataEl = document.getElementById('no-data')
  const scoreContent = document.getElementById('score-content')
  
  if (loadingEl) loadingEl.style.display = 'none'
  if (scoreContent) scoreContent.style.display = 'none'
  if (noDataEl) {
    noDataEl.style.display = 'block'
    noDataEl.textContent = 'No tracking data yet. Browse normally and data will appear.'
  }
}

function displaySiteScore(siteData) {
  // Validate data is for the current domain (normalize both for comparison)
  const normalizedSiteData = (siteData.domain || '').toLowerCase().replace('www.', '')
  const normalizedCurrent = currentDomain.toLowerCase().replace('www.', '')
  
  if (normalizedSiteData !== normalizedCurrent && siteData.domain !== currentDomain) {
    console.warn(`[Tracely] Data mismatch: ${siteData.domain} vs ${currentDomain}`)
    return
  }

  const scoreEl = document.getElementById('scoreValue')
  const badgeEl = document.getElementById('riskBadge')
  const trackerCountEl = document.getElementById('trackerCount')
  const uniqueTrackerCountEl = document.getElementById('uniqueTrackerCount')
  const trackersListEl = document.getElementById('trackersContent')
  const scoreContent = document.getElementById('score-content')
  const noData = document.getElementById('no-data')
  const statsContainer = document.getElementById('stats-container')
  const trackersList = document.getElementById('trackersList')
  const viewDetailsBtn = document.getElementById('viewDetailsBtn')

  const score = siteData.score || 0
  const trackerCount = siteData.trackerCount || 0
  const uniqueTrackerCount = siteData.uniqueTrackerCount
    ?? (siteData.uniqueTrackers ? siteData.uniqueTrackers.length : 0)
    ?? 0
  const trackers = siteData.trackers || []

  console.log(`[Tracely] Displaying score for ${currentDomain}:`, {score, trackerCount, uniqueTrackerCount})

  // Update score
  if (scoreEl) scoreEl.textContent = Math.round(score)

  // Update risk badge
  if (badgeEl) {
    let riskLevel = 'Low Risk'
    let riskClass = 'risk-low'
    if (score >= 70) {
      riskLevel = 'High Risk'
      riskClass = 'risk-high'
    } else if (score >= 40) {
      riskLevel = 'Medium Risk'
      riskClass = 'risk-medium'
    }
    badgeEl.textContent = riskLevel
    badgeEl.className = `risk-badge ${riskClass}`
  }

  // Update stats
  if (trackerCountEl) trackerCountEl.textContent = trackerCount
  if (uniqueTrackerCountEl) uniqueTrackerCountEl.textContent = uniqueTrackerCount

  // Show content
  if (scoreContent) scoreContent.style.display = 'block'
  if (noData) noData.style.display = 'none'
  if (statsContainer) statsContainer.style.display = 'grid'
  const loadingEl = document.getElementById('loading-spinner')
  if (loadingEl) loadingEl.style.display = 'none'

  // Display trackers
  if (trackers.length > 0 && trackersList && trackersListEl) {
    trackersList.style.display = 'block'
    trackersListEl.innerHTML = trackers.slice(0, 5).map((tracker) => {
      const riskColor = tracker.risk === 'high' ? '#c33' : tracker.risk === 'medium' ? '#c90' : '#999'
      return `
      <div class=\"tracker-item\">
        <div class=\"tracker-domain\">${tracker.domain}</div>
        <div class=\"tracker-category\" style=\"display:flex;justify-content:space-between;align-items:center;\">
          <span>${tracker.category} · ${tracker.type}</span>
          <span style=\"color:${riskColor};font-weight:600;font-size:10px;text-transform:uppercase;\">${tracker.risk}</span>
        </div>
      </div>
    `}).join('')
    if (trackers.length > 5) {
      trackersListEl.innerHTML += `<div class=\"tracker-item\" style=\"text-align:center;color:#999;\">+${trackers.length - 5} more trackers</div>`
    }
  } else if (trackersList) {
    trackersList.style.display = 'none'
  }

  // Show view details button
  if (viewDetailsBtn) {
    viewDetailsBtn.style.display = 'block'
    viewDetailsBtn.onclick = () => {
      chrome.tabs.create({
        url: `https://tracely-pi.vercel.app/site/${currentDomain}`,
      })
    }
  }
}

// Settings button - open dashboard
const settingsBtn = document.getElementById('settingsBtn')
if (settingsBtn) {
  settingsBtn.addEventListener('click', () => {
    chrome.tabs.create({
      url: 'https://tracely-pi.vercel.app',
    })
  })
}
