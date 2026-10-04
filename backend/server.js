require('dotenv').config()

const cors = require('cors')
const express = require('express')
const mongoose = require('mongoose')
const connectDatabase = require('./config/database')
const authRoutes = require('./routes/authRoutes')
const jobRoutes = require('./routes/jobRoutes')
const applicationRoutes = require('./routes/applicationRoutes')
const resumeRoutes = require('./routes/resumeRoutes')

const app = express()
const port = process.env.PORT || 5000

app.use(cors({ origin: process.env.FRONTEND_URL || 'http://localhost:5173' }))
app.use(express.json({ limit: '1mb' }))
app.use('/api/auth', authRoutes)
app.use('/api/jobs', jobRoutes)
app.use('/api/applications', applicationRoutes)
app.use('/api/resumes', resumeRoutes)

app.get('/api/health', (_request, response) => {
  response.json({
    status: 'ok',
    database: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
  })
})

async function startServer() {
  try {
    await connectDatabase()
    app.listen(port, () => {
      console.log(`API server listening on http://localhost:${port}`)
    })
  } catch (error) {
    console.error('Failed to start the API server:', error.message)
    process.exit(1)
  }
}

startServer()