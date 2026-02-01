import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import { connectDB } from './src/utils/db.js'
import { authMiddleware } from './src/middleware/auth.js'
import eventRoutes from './src/routes/events.js'
import siteRoutes from './src/routes/sites.js'
import trackerRoutes from './src/routes/trackers.js'
import analyticsRoutes from './src/routes/analytics.js'
import authRoutes from './src/routes/auth.js'

dotenv.config()

const app = express()

// Middleware
app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
  credentials: true,
}))
app.use(express.json())

// Auth middleware (applies to all routes)
app.use(authMiddleware)

// Connect to MongoDB
connectDB()

// Routes
app.use('/api/events', eventRoutes)
app.use('/api/site', siteRoutes)
app.use('/api/sites', siteRoutes)
app.use('/api/trackers', trackerRoutes)
app.use('/api/analytics', analyticsRoutes)
app.use('/api/auth', authRoutes)

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'Tracely Backend is running' })
})

// Error handler
app.use((err, req, res, next) => {
  console.error(err.stack)
  res.status(500).json({ error: 'Internal server error' })
})

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' })
})

const PORT = process.env.PORT || 3000

app.listen(PORT, () => {
  console.log(`🔐 Tracely Backend running on http://localhost:${PORT}`)
  console.log(`📊 API endpoints ready at http://localhost:${PORT}/api`)
})
