// Known tracker domains database (simplified)
export const KNOWN_TRACKERS = {
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

export const getTrackerInfo = (domain) => {
  const normalized = domain.toLowerCase()
  
  // Exact match
  if (KNOWN_TRACKERS[normalized]) {
    return KNOWN_TRACKERS[normalized]
  }
  
  // Partial match
  for (const [trackerDomain, info] of Object.entries(KNOWN_TRACKERS)) {
    if (normalized.includes(trackerDomain) || trackerDomain.includes(normalized)) {
      return info
    }
  }
  
  return { category: 'other', type: 'other', risk: 'low' }
}

export const detectFingerprinting = (metadata) => {
  // Check for canvas fingerprinting indicators
  if (metadata?.canvas || metadata?.webgl) {
    return true
  }
  
  // Check for font enumeration
  if (metadata?.fonts && Array.isArray(metadata.fonts) && metadata.fonts.length > 0) {
    return true
  }
  
  return false
}
