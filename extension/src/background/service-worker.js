// Service Worker for Tracely
// Listens to network requests and detects trackers

const BACKEND_URL = 'http://localhost:3000/api'

// Get user token from storage
async function getUserToken() {
  return new Promise((resolve) => {
    chrome.storage.local.get(['userToken'], (result) => {
      resolve(result.userToken || null)
    })
  })
}

// Initialize tracking data
chrome.runtime.onInstalled.addListener(() => {
  chrome.storage.local.set({ trackedSites: {} })
  console.log('Tracely installed and initialized')
})

// Listen for messages from content scripts
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.type === 'REPORT_TRACKER') {
    reportTracker(request.data, sender.tab)
  } else if (request.type === 'GET_SITE_DATA') {
    getSiteData(sender.tab.url, sendResponse)
    return true
  } else if (request.type === 'SYNC_TOKEN') {
    // Save user token from web app
    chrome.storage.local.set({ userToken: request.token }, () => {
      console.log('[Tracely] User token synced from web app')
      sendResponse({ success: true })
    })
    return true
  } else if (request.type === 'LOGOUT') {
    // Remove user token
    chrome.storage.local.remove(['userToken'], () => {
      console.log('[Tracely] User logged out, token removed')
      sendResponse({ success: true })
    })
    return true
  }
})

// Report tracker to backend
async function reportTracker(trackerData, tab) {
  try {
    const domain = new URL(tab.url).hostname
    const token = await getUserToken()
    
    const payload = {
      domain,
      requestUrl: trackerData.url,
      trackerDomain: trackerData.trackerDomain,
      metadata: trackerData.metadata || {},
    }

    // Send to backend with token if available
    try {
      const headers = {
        'Content-Type': 'application/json',
      }
      
      if (token) {
        headers['Authorization'] = `Bearer ${token}`
      }
      
      await fetch(`${BACKEND_URL}/events`, {
        method: 'POST',
        headers,
        body: JSON.stringify(payload),
      })
    } catch (err) {
      console.log('Backend unavailable, storing locally:', err)
    }

    // Update local storage (always store locally for quick access)
    updateLocalSiteData(domain, trackerData)
  } catch (err) {
    console.error('Error reporting tracker:', err)
  }
}

function updateLocalSiteData(domain, trackerData) {
  console.log(`[Service Worker] Updating site data for: ${domain}`, trackerData)
  
  chrome.storage.local.get([`site:${domain}`], (result) => {
    const siteData = result[`site:${domain}`] || {
      domain,
      trackerCount: 0,
      uniqueTrackerCount: 0,
      thirdPartyCount: 0,
      cookieCount: 0,
      score: 0,
      events: [],
      uniqueTrackers: [],
      lastUpdated: new Date().toISOString(),
    }

    console.log(`[Service Worker] Existing data for ${domain}:`, siteData)

    // Increment tracker count for each event (not unique domains)
    siteData.trackerCount++
    if (trackerData.isThirdParty) {
      siteData.thirdPartyCount++
    }
    if (trackerData.type === 'cookie') {
      siteData.cookieCount++
    }

    // Track unique tracker domains
    siteData.uniqueTrackers = siteData.uniqueTrackers || []
    if (trackerData.trackerDomain && !siteData.uniqueTrackers.includes(trackerData.trackerDomain)) {
      siteData.uniqueTrackers.push(trackerData.trackerDomain)
    }
    // Ensure uniqueTrackerCount >= 1 if trackerCount > 0 (logical consistency)
    siteData.uniqueTrackerCount = Math.max(siteData.uniqueTrackers.length, siteData.trackerCount > 0 ? 1 : 0)

    // Store event details for reference
    siteData.events = siteData.events || []
    siteData.events.push({
      domain: trackerData.trackerDomain,
      category: trackerData.category || 'other',
      type: trackerData.type || 'other',
      risk: trackerData.risk || 'low',
      isThirdParty: trackerData.isThirdParty || false,
      timestamp: new Date().toISOString(),
    })

    // Calculate privacy score (matches backend formula)
    const score = 
      (Math.sqrt(siteData.trackerCount) * 5) +
      (Math.log(Math.max(siteData.thirdPartyCount, 1)) * 4) +
      (Math.sqrt(Math.max(siteData.cookieCount, 0)) * 1.5)
    siteData.score = Math.min(Math.round(score), 100)
    
    // Set risk level (matches backend - adjusted thresholds: 0-30 Low, 31-60 Medium, 61-80 High, 81-100 Critical)
    if (siteData.score >= 81) {
      siteData.riskLevel = 'high'
    } else if (siteData.score >= 61) {
      siteData.riskLevel = 'medium'
    } else {
      siteData.riskLevel = 'low'
    }

    chrome.storage.local.set({ [`site:${domain}`]: siteData })
    console.log(`Updated site data for ${domain}:`, siteData)
  })
}

function getSiteData(url, sendResponse) {
  try {
    const domain = new URL(url).hostname
    chrome.storage.local.get([`site:${domain}`], (result) => {
      const siteData = result[`site:${domain}`] || {
        domain,
        score: 0,
        trackerCount: 0,
        thirdPartyCount: 0,
        trackers: [],
      }
      sendResponse(siteData)
    })
  } catch (err) {
    console.error('Error getting site data:', err)
    sendResponse({})
  }
}

// Listen to web requests (only available in manifest v3 with webRequest)
// For Manifest V3, we'll use content scripts and message passing
