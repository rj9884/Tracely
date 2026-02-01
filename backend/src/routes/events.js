import express from 'express'
import { Event } from '../models/Event.js'
import { Site } from '../models/Site.js'
import { Tracker } from '../models/Tracker.js'
import { extractDomain, isThirdParty, calculatePrivacyScore } from '../utils/helpers.js'
import { getTrackerInfo, detectFingerprinting } from '../utils/trackers.js'
import { recordScoreSnapshot } from '../utils/change-detection.js'

const router = express.Router()

// POST /events - Report tracking event
router.post('/', async (req, res) => {
  try {
    const { domain, requestUrl, trackerDomain, metadata } = req.body
    const userId = req.userId // From auth middleware (optional)

    console.log('[Events API] Received tracker report:', { domain, trackerDomain, requestUrl, userId })

    if (!domain) {
      console.error('[Events API] Missing domain in request body')
      return res.status(400).json({ error: 'Domain is required' })
    }

    // Get tracker info
    const trackerInfo = getTrackerInfo(trackerDomain)
    const isThirdPartyRequest = isThirdParty(trackerDomain, domain)

    // Create event (with userId if authenticated)
    const event = new Event({
      userId: userId || null,
      domain: domain.toLowerCase(),
      requestUrl,
      trackerDomain: trackerDomain.toLowerCase(),
      ...trackerInfo,
      metadata: {
        ...metadata,
        isThirdParty: isThirdPartyRequest,
        isFingerprinting: detectFingerprinting(metadata),
      },
    })

    await event.save()

    // Update site counts - filter by userId if authenticated
    const eventQuery = userId 
      ? { domain: domain.toLowerCase(), userId }
      : { domain: domain.toLowerCase(), userId: null }
    
    const events = await Event.find(eventQuery)
    let trackerCount = 0
    let thirdPartyCount = 0
    let cookieCount = 0
    const uniqueTrackerDomains = new Set()

    events.forEach((evt) => {
      trackerCount++ // Count every event as a tracker event
      if (evt.trackerDomain) {
        uniqueTrackerDomains.add(evt.trackerDomain)
      }
      if (evt.metadata?.isThirdParty) thirdPartyCount++
      if (evt.trackerType === 'cookie') cookieCount++
    })
    // Ensure uniqueTrackerCount >= 1 if trackerCount > 0 (logical consistency)
    const uniqueTrackerCount = Math.max(uniqueTrackerDomains.size, trackerCount > 0 ? 1 : 0)
    const score = calculatePrivacyScore(trackerCount, thirdPartyCount, cookieCount)
    
    console.log(`[Events API] Updated ${domain.toLowerCase()}: score=${score}, trackers=${trackerCount}, 3rdParty=${thirdPartyCount}, userId=${userId}`)
    
    // Set risk level (adjusted for new scoring scale: 0-30 Low, 31-60 Medium, 61-80 High, 81-100 Critical)
    let riskLevel = 'low'
    if (score >= 81) riskLevel = 'high'
    else if (score >= 61) riskLevel = 'medium'

    // Upsert site (update or create) - separate site per user
    const siteQuery = userId
      ? { domain: domain.toLowerCase(), userId }
      : { domain: domain.toLowerCase(), userId: null }
    
    const site = await Site.findOneAndUpdate(
      siteQuery,
      {
        $set: {
          trackerCount,
          uniqueTrackerCount,
          thirdPartyCount,
          cookieCount,
          score,
          riskLevel,
          lastScanned: new Date(),
        },
        $inc: { scanCount: 1 },
        $setOnInsert: {
          domain: domain.toLowerCase(),
          userId: userId || null,
          createdAt: new Date(),
        }
      },
      { upsert: true, new: true }
    )

    // 🔥 KILLER FEATURE: Record score history and detect behavioral changes
    // This is what differentiates us from Brave - we have MEMORY
    const currentTrackerDomains = [...uniqueTrackerDomains]
    const { snapshot, changeDetection } = recordScoreSnapshot(site, currentTrackerDomains)
    
    // Save history to site (atomic update to avoid version conflicts)
    await Site.updateOne(
      { _id: site._id },
      {
        $push: {
          scoreHistory: {
            $each: [snapshot],
            $slice: -30,
          },
        },
      }
    )
    
    if (changeDetection.hasChanges) {
      console.log(`[Change Detection] ${domain}: ${changeDetection.changeDescription}`)
    }

    // Update or create tracker (upsert)
    await Tracker.findOneAndUpdate(
      { domain: trackerDomain.toLowerCase() },
      {
        $set: {
          ...trackerInfo,
        },
        $inc: { sightingCount: 1 },
        $setOnInsert: {
          domain: trackerDomain.toLowerCase(),
          firstSeen: new Date(),
        }
      },
      { upsert: true, new: true }
    )

    res.status(201).json({
      success: true,
      data: { 
        event,
        changeDetection: changeDetection.hasChanges ? changeDetection : undefined,
      },
    })
  } catch (err) {
    console.error('Error creating event:', err)
    res.status(500).json({ error: 'Failed to create event' })
  }
})

export default router
