import express from 'express'
import { Event } from '../models/Event.js'
import { Site } from '../models/Site.js'
import { Tracker } from '../models/Tracker.js'
import { extractDomain, isThirdParty, calculatePrivacyScore } from '../utils/helpers.js'
import { getTrackerInfo, detectFingerprinting } from '../utils/trackers.js'
import { recordScoreSnapshot } from '../utils/change-detection.js'

const router = express.Router()

router.post('/', async (req, res) => {
  try {
    const { domain, requestUrl, trackerDomain, metadata } = req.body

    console.log('[Events API] Received tracker report:', { domain, trackerDomain, requestUrl })

    if (!domain) {
      console.error('[Events API] Missing domain in request body')
      return res.status(400).json({ error: 'Domain is required' })
    }

    const trackerInfo = getTrackerInfo(trackerDomain)
    const isThirdPartyRequest = isThirdParty(trackerDomain, domain)

    // Optimization: Check if this tracker is new for this site using indexed Event.exists BEFORE saving
    const isNewTrackerForSite = !(await Event.exists({
      domain: domain.toLowerCase(),
      trackerDomain: trackerDomain.toLowerCase()
    }))

    // Fix schema bug: Map 'type' from trackerInfo to 'trackerType'
    const event = new Event({
      domain: domain.toLowerCase(),
      requestUrl,
      trackerDomain: trackerDomain.toLowerCase(),
      category: trackerInfo.category,
      trackerType: trackerInfo.type, // Map 'type' from trackerInfo to 'trackerType'
      risk: trackerInfo.risk,
      metadata: {
        ...metadata,
        isThirdParty: isThirdPartyRequest,
        isFingerprinting: detectFingerprinting(metadata),
      },
    })

    await event.save()

    // Get Tracker object to link its ObjectId to the Site
    const tracker = await Tracker.findOneAndUpdate(
      { domain: trackerDomain.toLowerCase() },
      {
        $set: {
          category: trackerInfo.category,
          type: trackerInfo.type,
          risk: trackerInfo.risk,
        },
        $inc: { sightingCount: 1 },
        $setOnInsert: {
          domain: trackerDomain.toLowerCase(),
          firstSeen: new Date(),
        }
      },
      { upsert: true, new: true }
    )

    // Optimization: Perform update with $inc, avoiding the heavy Event.aggregate query
    const updateQuery = {
      $inc: {
        trackerCount: 1,
        scanCount: 1,
        thirdPartyCount: isThirdPartyRequest ? 1 : 0,
        cookieCount: trackerInfo.type === 'cookie' ? 1 : 0,
        uniqueTrackerCount: isNewTrackerForSite ? 1 : 0
      },
      $set: {
        lastScanned: new Date(),
      },
      $setOnInsert: {
        domain: domain.toLowerCase(),
        createdAt: new Date(),
      }
    }

    // Add tracker ObjectId to trackers array if it's new
    if (isNewTrackerForSite) {
      updateQuery.$addToSet = { trackers: tracker._id }
    }

    // Update site metrics using atomic increment
    const site = await Site.findOneAndUpdate(
      { domain: domain.toLowerCase() },
      updateQuery,
      { upsert: true, new: true }
    )

    // Calculate privacy score based on updated counts
    const score = calculatePrivacyScore(site.trackerCount, site.thirdPartyCount, site.cookieCount)
    let riskLevel = 'low'
    if (score >= 81) riskLevel = 'high'
    else if (score >= 61) riskLevel = 'medium'

    // Update score and riskLevel on the site doc
    site.score = score
    site.riskLevel = riskLevel

    // Retrieve unique tracker domains to detect history changes
    const currentTrackerDomains = await Event.distinct('trackerDomain', { domain: domain.toLowerCase() })
    const { snapshot, changeDetection } = recordScoreSnapshot(site, currentTrackerDomains)

    // Save final score and push scoreHistory
    await Site.updateOne(
      { _id: site._id },
      {
        $set: { score, riskLevel },
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
