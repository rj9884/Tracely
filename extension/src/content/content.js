// Content script to detect trackers on the page
// Injected into every page

// Tracker detection utility functions
const KNOWN_TRACKERS = {
  'google-analytics.com': { category: 'analytics', type: 'script', risk: 'low' },
  'analytics.google.com': { category: 'analytics', type: 'api_call', risk: 'low' },
  'googletagmanager.com': { category: 'analytics', type: 'script', risk: 'low' },
  'googletagservices.com': { category: 'advertising', type: 'script', risk: 'low' },
  'googleadservices.com': { category: 'advertising', type: 'script', risk: 'low' },
  'doubleclick.net': { category: 'advertising', type: 'script', risk: 'high' },
  'facebook.com': { category: 'advertising', type: 'pixel', risk: 'high' },
  'facebook.net': { category: 'advertising', type: 'pixel', risk: 'high' },
  'facebook-pixel.com': { category: 'tracking', type: 'pixel', risk: 'high' },
  'twitter.com': { category: 'social', type: 'script', risk: 'medium' },
  'twitter-pixel.com': { category: 'tracking', type: 'pixel', risk: 'medium' },
  'linkedin.com': { category: 'social', type: 'script', risk: 'medium' },
  'linkedin-insight.com': { category: 'tracking', type: 'pixel', risk: 'medium' },
  'licdn.com': { category: 'social', type: 'script', risk: 'medium' },
  'snapchat.com': { category: 'social', type: 'script', risk: 'medium' },
  'tiktok.com': { category: 'social', type: 'script', risk: 'medium' },
  'pinterest.com': { category: 'social', type: 'script', risk: 'medium' },
  'adnxs.com': { category: 'advertising', type: 'script', risk: 'high' },
  'amazon-adsystem.com': { category: 'advertising', type: 'script', risk: 'medium' },
  'scorecardresearch.com': { category: 'analytics', type: 'script', risk: 'low' },
  'hotjar.com': { category: 'analytics', type: 'script', risk: 'medium' },
  'mixpanel.com': { category: 'analytics', type: 'script', risk: 'low' },
  'amplitude.com': { category: 'analytics', type: 'script', risk: 'low' },
  'segment.com': { category: 'analytics', type: 'script', risk: 'medium' },
  'segment.io': { category: 'analytics', type: 'script', risk: 'medium' },
  'crazyegg.com': { category: 'analytics', type: 'script', risk: 'medium' },
  'optimizely.com': { category: 'analytics', type: 'script', risk: 'low' },
  'quantserve.com': { category: 'analytics', type: 'script', risk: 'low' },
  'criteo.com': { category: 'advertising', type: 'script', risk: 'high' },
  'criteo.js': { category: 'advertising', type: 'script', risk: 'high' },
  'bluekai.com': { category: 'advertising', type: 'script', risk: 'high' },
  'rubiconproject.com': { category: 'advertising', type: 'script', risk: 'high' },
  'pubmatic.com': { category: 'advertising', type: 'script', risk: 'high' },
  'openx.net': { category: 'advertising', type: 'script', risk: 'high' },
  'casalemedia.com': { category: 'advertising', type: 'script', risk: 'high' },
  'yieldlab.net': { category: 'advertising', type: 'script', risk: 'medium' },
  'outbrain.com': { category: 'advertising', type: 'script', risk: 'medium' },
  'taboola.com': { category: 'advertising', type: 'script', risk: 'high' },
  'indexww.com': { category: 'advertising', type: 'script', risk: 'high' },
  'smartadserver.com': { category: 'advertising', type: 'script', risk: 'medium' },
  'adtech.de': { category: 'advertising', type: 'script', risk: 'high' },
  'advertising.com': { category: 'advertising', type: 'script', risk: 'high' },
  'bidswitch.net': { category: 'advertising', type: 'script', risk: 'high' },
  'mathtag.com': { category: 'advertising', type: 'script', risk: 'high' },
  'conviva.com': { category: 'analytics', type: 'script', risk: 'low' },
  'chartbeat.com': { category: 'analytics', type: 'script', risk: 'low' },
  'demdex.net': { category: 'tracking', type: 'script', risk: 'high' },
  'krxd.net': { category: 'tracking', type: 'script', risk: 'high' },
  'omtrdc.net': { category: 'analytics', type: 'script', risk: 'medium' },
  'adroll.com': { category: 'advertising', type: 'script', risk: 'high' },
  'sentry.io': { category: 'analytics', type: 'script', risk: 'low' },
  'newrelic.com': { category: 'analytics', type: 'script', risk: 'low' },
  'intercom.io': { category: 'data', type: 'script', risk: 'medium' },
  'zendesk.com': { category: 'data', type: 'script', risk: 'low' },
}

const KNOWN_CDNS = [
  'cdnjs.cloudflare.com',
  'cdn.jsdelivr.net',
  'unpkg.com',
  'googleapis.com',
  'fonts.googleapis.com',
  'fonts.gstatic.com',
  'ajax.googleapis.com',
  'code.jquery.com',
  'bootstrapcdn.com',
  'stackpath.bootstrapcdn.com',
  'use.fontawesome.com',
  'wp.com',
  'githubassets.com',
  'stripe.com',
  'js.stripe.com',
  'paypal.com',
  'paypalobjects.com',
  'recaptcha.net'
]

function isThirdParty(requestDomain, pageDomain) {
  const normalizeeDomain = (domain) => {
    try {
      const url = new URL(domain.startsWith('http') ? domain : `https://${domain}`)
      return url.hostname.replace('www.', '')
    } catch {
      return domain
    }
  }

  const reqDom = normalizeeDomain(requestDomain)
  const pageDom = normalizeeDomain(pageDomain)
  return !reqDom.includes(pageDom) && !pageDom.includes(reqDom)
}

function getTrackerInfo(domain) {
  const normalized = domain.toLowerCase()

  for (const [trackerDomain, info] of Object.entries(KNOWN_TRACKERS)) {
    if (normalized.includes(trackerDomain) || trackerDomain.includes(normalized)) {
      return info
    }
  }

  return { category: 'other', type: 'other', risk: 'low' }
}

function isTracker(domain, url = '') {
  const normalized = domain.toLowerCase()
  
  // 1. Check if it's a known safe CDN/utility
  for (const cdn of KNOWN_CDNS) {
    if (normalized === cdn || normalized.endsWith('.' + cdn)) {
      return false
    }
  }
  
  // 2. Check if it's in the tracker blocklist
  for (const tracker of Object.keys(KNOWN_TRACKERS)) {
    if (normalized.includes(tracker) || tracker.includes(normalized)) {
      return true
    }
  }

  // 3. Fallback: Check if URL contains common tracking path keywords
  const lowercaseUrl = url.toLowerCase()
  const trackingKeywords = [
    '/ads/', '/ad/', 'analytics', 'pixel', 'tracker', 'tracking', 'telemetry', 
    'beacon', 'marketing', 'retargeting', 'visitor', 'metrics', 'doubleclick'
  ]
  for (const keyword of trackingKeywords) {
    if (lowercaseUrl.includes(keyword)) {
      return true
    }
  }

  return false
}

// Detect script injections
function detectScripts() {
  const scripts = document.querySelectorAll('script[src]')
  scripts.forEach((script) => {
    const src = script.src
    try {
      const url = new URL(src)
      const domain = url.hostname

      const pageDomain = window.location.hostname
      if (isThirdParty(domain, pageDomain)) {
        if (isTracker(domain, src)) {
          const trackerInfo = getTrackerInfo(domain)
          reportTracker({
            url: src,
            trackerDomain: domain,
            category: trackerInfo.category,
            type: 'script',
            isThirdParty: true,
            ...trackerInfo,
          })
        }
      }
    } catch (err) {
      console.log('Error parsing script URL:', src, err)
    }
  })
}

// Detect image pixels (1x1 tracking pixels)
function detectPixels() {
  const images = document.querySelectorAll('img[src]')
  images.forEach((img) => {
    if ((img.width === 1 && img.height === 1) || (img.offsetWidth === 1 && img.offsetHeight === 1)) {
      const src = img.src
      try {
        const url = new URL(src)
        const domain = url.hostname

        const pageDomain = window.location.hostname
        if (isThirdParty(domain, pageDomain)) {
          if (isTracker(domain, src)) {
            const trackerInfo = getTrackerInfo(domain)
            reportTracker({
              url: src,
              trackerDomain: domain,
              category: trackerInfo.category,
              type: 'pixel',
              isThirdParty: true,
              ...trackerInfo,
            })
          }
        }
      } catch (err) {
        console.log('Error parsing pixel URL:', src, err)
      }
    }
  })
}

// Detect localStorage and sessionStorage access
function detectStorageAccess() {
  const storageData = []

  try {
    if (localStorage.length > 0) {
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i)
        storageData.push({ type: 'localStorage', key })
      }
    }
  } catch (err) {
    console.log('localStorage access denied')
  }

  try {
    if (sessionStorage.length > 0) {
      for (let i = 0; i < sessionStorage.length; i++) {
        const key = sessionStorage.key(i)
        storageData.push({ type: 'sessionStorage', key })
      }
    }
  } catch (err) {
    console.log('sessionStorage access denied')
  }

  return storageData
}

// Report tracker to background script
function reportTracker(trackerData) {
  chrome.runtime.sendMessage({
    type: 'REPORT_TRACKER',
    data: trackerData,
  }, (response) => {
    if (chrome.runtime.lastError) {
      console.log('Extension context invalid, skipping report')
    }
  })
}

// Run detection when page loads
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    setTimeout(() => {
      detectScripts()
      detectPixels()
      detectStorageAccess()
    }, 100)
  })
} else {
  setTimeout(() => {
    detectScripts()
    detectPixels()
    detectStorageAccess()
  }, 100)
}

// Also run on dynamic content (debounced to prevent infinite loop)
let detectionTimeout = null
let lastDetectionTime = Date.now()
let idleTimeout = null
let detectionCount = 0
const MAX_DETECTION_RUNS = 50 // Stop after 50 detection runs

const observer = new MutationObserver(() => {
  if (detectionTimeout) return
  if (detectionCount >= MAX_DETECTION_RUNS) {
    observer.disconnect()
    console.log('Tracely: Stopped observing DOM changes (50 scans completed)')
    return
  }
  detectionTimeout = setTimeout(() => {
    detectionCount++
    detectScripts()
    detectPixels()
    lastDetectionTime = Date.now()
    detectionTimeout = null
    
    // Reset idle timer whenever we detect changes
    if (idleTimeout) clearTimeout(idleTimeout)
    idleTimeout = setTimeout(() => {
      observer.disconnect()
      console.log('Tracely: Stopped observing DOM changes (no activity for 30s)')
    }, 30000) // Stop if no DOM changes for 30 seconds
  }, 1000) // Run at most once per second
})

observer.observe(document, {
  childList: true,
  subtree: true,
  attributes: false,
})

// Stop if no activity after 30 seconds
idleTimeout = setTimeout(() => {
  observer.disconnect()
  console.log('Tracely: Stopped observing DOM changes (no activity for 30s)')
}, 30000)

// Respond to popup requests
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.type === 'GET_PAGE_DATA') {
    sendResponse({
      url: window.location.href,
      domain: window.location.hostname,
      title: document.title,
    })
  }
})
