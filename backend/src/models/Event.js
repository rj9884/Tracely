import mongoose from 'mongoose'

const eventSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      index: true,
    },
    domain: {
      type: String,
      required: true,
      index: true,
    },
    requestUrl: String,
    trackerDomain: String,
    trackerType: {
      type: String,
      enum: ['cookie', 'pixel', 'script', 'api_call', 'fingerprint', 'other'],
      default: 'other',
    },
    category: {
      type: String,
      enum: ['analytics', 'advertising', 'social', 'cdn', 'payment', 'tracking', 'data', 'other'],
      default: 'other',
    },
    risk: {
      type: String,
      enum: ['low', 'medium', 'high'],
      default: 'low',
    },
    metadata: mongoose.Schema.Types.Mixed,
  },
  { timestamps: true }
)

eventSchema.index({ userId: 1, domain: 1, createdAt: -1 })
eventSchema.index({ domain: 1, createdAt: -1 })
eventSchema.index({ trackerDomain: 1, createdAt: -1 })
eventSchema.index({ domain: 1, trackerDomain: 1 })

export const Event = mongoose.model('Event', eventSchema)
