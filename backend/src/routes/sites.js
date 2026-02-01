import express from 'express'
import { Site } from '../models/Site.js'
import { Event } from '../models/Event.js'
import { getRecentChanges, detectAnomalies, generateAuditReport } from '../utils/change-detection.js'

const router = express.Router()

// GET /site/:domain/score
router.get('/:domain/score', async (req, res) => {
  try {
    const { domain } = req.params
    const site = await Site.findOne({ domain: domain.toLowerCase() })

    if (!site) {
      return res.status(404).json({ error: 'Site not found' })
    }

    res.json({
      success: true,
      data: {
        domain: site.domain,
        score: site.score,
        riskLevel: site.riskLevel,
        trackerCount: site.trackerCount,
        uniqueTrackerCount: site.uniqueTrackerCount,
        thirdPartyCount: site.thirdPartyCount,
        lastScanned: site.lastScanned,
      },
    })
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch site score' })
  }
})

// GET /site/:domain/details - User's view of a site, fallback to global
router.get('/:domain/details', async (req, res) => {
  try {
    const { domain } = req.params
    const userId = req.userId // May be undefined
    
    // Try to find user's site first if authenticated, then fallback to any site
    let site = userId 
      ? await Site.findOne({ domain: domain.toLowerCase(), userId })
      : null
    
    if (!site) {
      site = await Site.findOne({ domain: domain.toLowerCase() })
    }

    if (!site) {
      return res.status(404).json({ error: 'Site not found' })
    }

    // Get events - user's events if authenticated, otherwise all
    const eventQuery = userId 
      ? { domain: domain.toLowerCase(), userId }
      : { domain: domain.toLowerCase() }
    
    const events = await Event.find(eventQuery)
      .limit(100)
      .sort({ createdAt: -1 })

    // Build trend data (simplified)
    const trend = [
      { date: 'Jan 1', score: site.score - 10 },
      { date: 'Jan 8', score: site.score - 7 },
      { date: 'Jan 15', score: site.score - 3 },
      { date: 'Jan 22', score: site.score - 1 },
      { date: 'Jan 31', score: site.score },
    ]

    res.json({
      success: true,
      data: {
        domain: site.domain,
        score: site.score,
        riskLevel: site.riskLevel,
        trackerCount: site.trackerCount,
        uniqueTrackerCount: site.uniqueTrackerCount,
        thirdPartyCount: site.thirdPartyCount,
        cookieCount: site.cookieCount,
        firstSeen: site.createdAt,
        lastUpdated: site.updatedAt,
        scanCount: site.scanCount,
        summary: `${site.domain} has a privacy risk score of ${site.score}/100 with ${site.trackerCount} trackers detected.`,
        trackers: events.map((evt) => ({
          domain: evt.trackerDomain,
          category: evt.category,
          type: evt.trackerType,
          risk: evt.risk,
        })),
        riskTrend: trend,
      },
    })
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch site details' })
  }
})

// 🔍 Regulator/Researcher Mode: Evidence timeline
// GET /site/:domain/evidence
router.get('/:domain/evidence', async (req, res) => {
  try {
    const { domain } = req.params
    const limit = parseInt(req.query.limit) || 200
    const userId = req.userId // May be undefined

    // Get user's events if authenticated, otherwise all events
    const eventQuery = userId
      ? { domain: domain.toLowerCase(), userId }
      : { domain: domain.toLowerCase() }

    const events = await Event.find(eventQuery)
      .sort({ createdAt: -1 })
      .limit(limit)
      .lean()

    if (!events || events.length === 0) {
      return res.json({
        success: true,
        data: {
          domain: domain.toLowerCase(),
          observations: [],
          timeline: [],
        },
      })
    }

    const trackerMap = new Map()
    const timeline = events.map((evt) => {
      let path = ''
      try {
        path = new URL(evt.requestUrl).pathname || ''
      } catch (_) {
        path = ''
      }

      const key = evt.trackerDomain || 'unknown'
      const existing = trackerMap.get(key) || {
        trackerDomain: key,
        category: evt.category,
        trackerType: evt.trackerType,
        count: 0,
        firstSeen: evt.createdAt,
        lastSeen: evt.createdAt,
        samplePath: path,
      }

      existing.count += 1
      if (evt.createdAt < existing.firstSeen) existing.firstSeen = evt.createdAt
      if (evt.createdAt > existing.lastSeen) existing.lastSeen = evt.createdAt
      if (!existing.samplePath && path) existing.samplePath = path

      trackerMap.set(key, existing)

      return {
        observedAt: evt.createdAt,
        trackerDomain: key,
        category: evt.category,
        trackerType: evt.trackerType,
        requestPath: path,
        risk: evt.risk,
      }
    })

    const observations = [...trackerMap.values()].map((item) => {
      let confidence = 'low'
      if (item.count >= 50) confidence = 'high'
      else if (item.count >= 10) confidence = 'medium'

      return {
        ...item,
        confidence,
        persistenceDays: Math.max(
          1,
          Math.ceil((new Date(item.lastSeen) - new Date(item.firstSeen)) / (1000 * 60 * 60 * 24))
        ),
      }
    })

    res.json({
      success: true,
      data: {
        domain: domain.toLowerCase(),
        observations,
        timeline,
      },
    })
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch evidence timeline' })
  }
})

// GET /sites/debug/all - Debug endpoint to list all sites
router.get('/debug/all', async (req, res) => {
  try {
    const sites = await Site.find().select('domain score trackerCount uniqueTrackerCount thirdPartyCount').lean()
    const events = await Event.find().select('domain trackerDomain category').lean()
    
    console.log('[Debug Sites]', sites)
    console.log('[Debug Events Sample]', events.slice(0, 10))
    
    res.json({ 
      sites,
      eventCount: events.length,
      eventsSample: events.slice(0, 10)
    })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// GET /sites - User's own sites
router.get('/', async (req, res) => {
  try {
    const userId = req.userId // May be undefined if not authenticated
    
    if (!userId) {
      return res.status(401).json({ error: 'Authentication required to view personal sites' })
    }
    
    // Only show user's own sites
    const sites = await Site.find({ userId })
      .sort({ score: -1 })
      .limit(50)

    res.json({
      success: true,
      data: sites.map((site) => ({
        domain: site.domain,
        score: site.score,
        riskLevel: site.riskLevel,
        trackerCount: site.trackerCount,
        uniqueTrackerCount: site.uniqueTrackerCount,
        thirdPartyCount: site.thirdPartyCount,
        lastScanned: site.lastScanned,
      })),
      mode: 'personal',
    })
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch sites' })
  }
})

// GET /sites/global/stats - Aggregated stats from all users (public data)
router.get('/global/stats', async (req, res) => {
  try {
    // Get ALL sites (both user-specific and global aggregate)
    // For now, combine all data as global
    const sites = await Site.find()
      .sort({ trackerCount: -1 })
      .limit(50)
      .select('domain score riskLevel trackerCount uniqueTrackerCount lastScanned')

    res.json({
      success: true,
      data: sites.map((site) => ({
        domain: site.domain,
        score: site.score,
        riskLevel: site.riskLevel,
        trackerCount: site.trackerCount,
        uniqueTrackerCount: site.uniqueTrackerCount,
        lastScanned: site.lastScanned,
      })),
      mode: 'global',
    })
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch global stats' })
  }
})

// 🔥 KILLER FEATURE: GET /site/:domain/history
// Shows score changes over time - Brave CANNOT do this
router.get('/:domain/history', async (req, res) => {
  try {
    const { domain } = req.params
    const site = await Site.findOne({ domain: domain.toLowerCase() })

    if (!site) {
      return res.status(404).json({ error: 'Site not found' })
    }

    res.json({
      success: true,
      data: {
        domain: site.domain,
        scoreHistory: site.scoreHistory || [],
        currentScore: site.score,
        firstSeen: site.createdAt,
        lastScanned: site.lastScanned,
      },
    })
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch site history' })
  }
})

// 🔥 KILLER FEATURE: GET /site/:domain/changes
// Shows behavioral changes - "amazon.com added 3 new trackers last week"
router.get('/:domain/changes', async (req, res) => {
  try {
    const { domain } = req.params
    const days = parseInt(req.query.days) || 30
    const site = await Site.findOne({ domain: domain.toLowerCase() })

    if (!site) {
      return res.status(404).json({ error: 'Site not found' })
    }

    const recentChanges = getRecentChanges(site, days)

    res.json({
      success: true,
      data: {
        domain: site.domain,
        timeframe: `Last ${days} days`,
        changeCount: recentChanges.length,
        changes: recentChanges,
      },
    })
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch site changes' })
  }
})

// 🔥 KILLER FEATURE: GET /site/:domain/anomalies
// Detects unusual behavior patterns
router.get('/:domain/anomalies', async (req, res) => {
  try {
    const { domain } = req.params
    const site = await Site.findOne({ domain: domain.toLowerCase() })

    if (!site) {
      return res.status(404).json({ error: 'Site not found' })
    }

    const anomalyDetection = detectAnomalies(site)

    res.json({
      success: true,
      data: {
        domain: site.domain,
        hasAnomalies: anomalyDetection.hasAnomalies,
        anomalies: anomalyDetection.anomalies,
      },
    })
  } catch (err) {
    res.status(500).json({ error: 'Failed to detect anomalies' })
  }
})

// 🔥 KILLER FEATURE: GET /site/:domain/audit-report
// Generates compliance audit report - for regulators
router.get('/:domain/audit-report', async (req, res) => {
  try {
    const { domain } = req.params
    const site = await Site.findOne({ domain: domain.toLowerCase() })

    if (!site) {
      return res.status(404).json({ error: 'Site not found' })
    }

    const auditReport = generateAuditReport(site)

    res.json({
      success: true,
      data: auditReport,
    })
  } catch (err) {
    res.status(500).json({ error: 'Failed to generate audit report' })
  }
})

export default router
