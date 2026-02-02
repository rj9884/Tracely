/**
 * Record a score snapshot and detect behavioral changes
 * @param {Object} site - Mongoose Site document
 * @param {Array} currentTrackers - Array of current tracker domains
 * @returns {Object} changeDetection result
 */
export function recordScoreSnapshot(site, currentTrackers = []) {
  const previousHistory = site.scoreHistory || []
  const lastSnapshot = previousHistory[previousHistory.length - 1]

  // Detect what changed
  const changeDetection = {
    hasChanges: false,
    trackersAdded: [],
    trackersRemoved: [],
    scoreChanged: false,
    changeReason: 'periodic_snapshot',
    changeDescription: '',
  }

  if (lastSnapshot) {
    const previousTrackers = new Set(lastSnapshot.trackersAdded || [])
    const currentTrackerSet = new Set(currentTrackers)

    // Detect new trackers
    changeDetection.trackersAdded = currentTrackers.filter(
      (tracker) => !previousTrackers.has(tracker)
    )

    // Detect removed trackers
    changeDetection.trackersRemoved = [...previousTrackers].filter(
      (tracker) => !currentTrackerSet.has(tracker)
    )

    // Score change detection
    changeDetection.scoreChanged = Math.abs(site.score - lastSnapshot.score) > 5

    // Determine change reason
    if (changeDetection.trackersAdded.length > 0) {
      changeDetection.hasChanges = true
      changeDetection.changeReason = 'new_tracker'
      changeDetection.changeDescription = `Added ${changeDetection.trackersAdded.length} new tracker(s): ${changeDetection.trackersAdded.slice(0, 3).join(', ')}`
    } else if (changeDetection.trackersRemoved.length > 0) {
      changeDetection.hasChanges = true
      changeDetection.changeReason = 'tracker_removed'
      changeDetection.changeDescription = `Removed ${changeDetection.trackersRemoved.length} tracker(s): ${changeDetection.trackersRemoved.slice(0, 3).join(', ')}`
    } else if (changeDetection.scoreChanged) {
      changeDetection.hasChanges = true
      const direction = site.score > lastSnapshot.score ? 'increased' : 'decreased'
      changeDetection.changeReason =
        direction === 'increased' ? 'increased_frequency' : 'decreased_frequency'
      changeDetection.changeDescription = `Privacy risk ${direction} from ${lastSnapshot.score} to ${site.score}`
    }
  } else {
    // First snapshot ever
    changeDetection.changeReason = 'first_scan'
    changeDetection.changeDescription = `Initial scan: ${site.trackerCount} tracker(s) detected`
    changeDetection.trackersAdded = currentTrackers
  }

  // Create new snapshot
  const snapshot = {
    date: new Date(),
    score: site.score,
    trackerCount: site.trackerCount,
    uniqueTrackerCount: site.uniqueTrackerCount,
    thirdPartyCount: site.thirdPartyCount,
    trackersAdded: changeDetection.trackersAdded,
    trackersRemoved: changeDetection.trackersRemoved,
    changeReason: changeDetection.changeReason,
    changeDescription: changeDetection.changeDescription,
  }

  // Add to history (keep last 30 snapshots to avoid unbounded growth)
  if (!site.scoreHistory) {
    site.scoreHistory = []
  }
  site.scoreHistory.push(snapshot)
  if (site.scoreHistory.length > 30) {
    site.scoreHistory.shift() // Remove oldest
  }

  return {
    snapshot,
    changeDetection,
  }
}

/**
 * Get recent behavioral changes for a site
 * @param {Object} site - Mongoose Site document
 * @param {Number} days - Number of days to look back
 * @returns {Array} Recent changes
 */
export function getRecentChanges(site, days = 7) {
  if (!site.scoreHistory || site.scoreHistory.length === 0) {
    return []
  }

  const cutoffDate = new Date()
  cutoffDate.setDate(cutoffDate.getDate() - days)

  return site.scoreHistory
    .filter((snapshot) => {
      return (
        new Date(snapshot.date) > cutoffDate &&
        snapshot.changeReason !== 'periodic_snapshot' &&
        (snapshot.trackersAdded.length > 0 || snapshot.trackersRemoved.length > 0)
      )
    })
    .map((snapshot) => ({
      date: snapshot.date,
      description: snapshot.changeDescription,
      reason: snapshot.changeReason,
      trackersAdded: snapshot.trackersAdded,
      trackersRemoved: snapshot.trackersRemoved,
      scoreBefore: snapshot.score,
    }))
}

/**
 * Detect anomalies in tracking behavior
 * This is placeholder for future ML-based anomaly detection
 * @param {Object} site - Mongoose Site document
 * @returns {Object} Anomaly detection results
 */
export function detectAnomalies(site) {
  if (!site.scoreHistory || site.scoreHistory.length < 3) {
    return { hasAnomalies: false, anomalies: [] }
  }

  const anomalies = []

  // Simple heuristic: sudden score jump > 20 points
  for (let i = 1; i < site.scoreHistory.length; i++) {
    const prev = site.scoreHistory[i - 1]
    const curr = site.scoreHistory[i]
    const scoreDelta = curr.score - prev.score

    if (Math.abs(scoreDelta) > 20) {
      anomalies.push({
        date: curr.date,
        type: scoreDelta > 0 ? 'sudden_increase' : 'sudden_decrease',
        description: `Privacy score ${scoreDelta > 0 ? 'jumped' : 'dropped'} by ${Math.abs(scoreDelta)} points`,
        severity: 'high',
      })
    }
  }

  // Detect tracker spike: 5+ new trackers at once
  const recentAdds = site.scoreHistory
    .filter((s) => s.trackersAdded && s.trackersAdded.length >= 5)
    .map((s) => ({
      date: s.date,
      type: 'tracker_spike',
      description: `Added ${s.trackersAdded.length} trackers simultaneously`,
      severity: 'medium',
    }))

  anomalies.push(...recentAdds)

  return {
    hasAnomalies: anomalies.length > 0,
    anomalies,
  }
}

/**
 * Generate a compliance audit report for a site
 * This is what regulators want - timestamped evidence
 * @param {Object} site - Mongoose Site document
 * @returns {Object} Audit report
 */
export function generateAuditReport(site) {
  const recentChanges = getRecentChanges(site, 30) // Last 30 days
  const anomalies = detectAnomalies(site)

  return {
    domain: site.domain,
    auditDate: new Date(),
    currentRiskScore: site.score,
    riskLevel: site.riskLevel,
    totalTrackers: site.trackerCount,
    firstDetected: site.createdAt,
    lastScanned: site.lastScanned,
    scanCount: site.scanCount,
    
    // Historical analysis
    scoreHistory: site.scoreHistory || [],
    recentChanges,
    anomalies: anomalies.anomalies,
    
    // Compliance notes
    complianceNotes: {
      gdprRelevant: site.trackerCount > 0,
      ccpaRelevant: site.thirdPartyCount > 0,
      evidenceCollected: site.scoreHistory?.length || 0,
      timestampedAuditTrail: true,
    },
    
    // Summary
    summary: `${site.domain} has been monitored ${site.scanCount} times since ${new Date(site.createdAt).toLocaleDateString()}. Current privacy risk score: ${site.score}/100. ${recentChanges.length} significant changes detected in the last 30 days.`,
  }
}
