const express = require('express')
const mongoose = require('mongoose')
const Job = require('../models/Job')
const ResumeAnalysis = require('../models/ResumeAnalysis')
const { authenticateToken, requireRole } = require('../middleware/authMiddleware')
const { uploadResume } = require('../middleware/resumeUpload')
const {
  analyzeResumeText,
  extractResumeText,
} = require('../services/resumeAnalyzerService')

const router = express.Router()
const candidateOnly = [authenticateToken, requireRole('Candidate')]

async function analyzeResume(request, response) {
  const jobId = typeof request.body?.jobId === 'string' ? request.body.jobId.trim() : ''
  const pastedDescription = typeof request.body?.jobDescription === 'string'
    ? request.body.jobDescription.trim()
    : ''

  if (Boolean(jobId) === Boolean(pastedDescription)) {
    return response.status(400).json({
      message: 'Provide exactly one active job ID or job description.',
    })
  }

  if (pastedDescription.length > 12000) {
    return response.status(400).json({ message: 'Job description must be 12,000 characters or fewer.' })
  }

  if (mongoose.connection.readyState !== 1) {
    return response.status(503).json({ message: 'The database is unavailable. Check the MongoDB connection.' })
  }

  let job = null
  if (jobId) {
    if (!mongoose.isValidObjectId(jobId)) {
      return response.status(400).json({ message: 'This job ID is invalid.' })
    }

    try {
      job = await Job.findOne({ _id: jobId, isActive: true }).lean()
    } catch {
      return response.status(500).json({ message: 'Unable to load the selected job right now.' })
    }

    if (!job) {
      return response.status(404).json({ message: 'The selected job is not active or no longer exists.' })
    }
  }

  let resumeText
  try {
    resumeText = await extractResumeText(request.file.buffer)
  } catch (error) {
    return response.status(422).json({ message: error.message })
  }

  let analysis
  try {
    analysis = await analyzeResumeText(resumeText, {
      jobDescription: job ? job.description : pastedDescription,
      requiredSkills: job?.requiredSkills || [],
    })
  } catch (error) {
    return response.status(error.statusCode || 502).json({
      message: error.message || 'Unable to analyze this resume right now.',
    })
  }

  try {
    const savedAnalysis = await ResumeAnalysis.create({
      candidate: request.user.id,
      job: job ? job._id : null,
      score: analysis.score,
      matchedSkills: analysis.matchedSkills,
      missingSkills: analysis.missingSkills,
      summary: analysis.summary,
      suggestions: analysis.suggestions,
      interviewQuestions: analysis.interviewQuestions,
    })

    return response.status(201).json({ analysis: savedAnalysis })
  } catch (error) {
    console.error('Unable to save resume analysis:', error.name)
    return response.status(500).json({ message: 'Unable to save the resume analysis right now.' })
  }
}

async function getAnalyses(request, response) {
  if (mongoose.connection.readyState !== 1) {
    return response.status(503).json({ message: 'The database is unavailable. Check the MongoDB connection.' })
  }

  try {
    const analyses = await ResumeAnalysis.find({ candidate: request.user.id })
      .sort({ createdAt: -1 })
      .limit(50)
      .lean()

    return response.json({ analyses })
  } catch (error) {
    console.error('Unable to load resume analyses:', error.message)
    return response.status(500).json({ message: 'Unable to load your resume analyses right now.' })
  }
}

async function getAnalysisById(request, response) {
  if (!mongoose.isValidObjectId(request.params.analysisId)) {
    return response.status(400).json({ message: 'This resume analysis ID is invalid.' })
  }

  if (mongoose.connection.readyState !== 1) {
    return response.status(503).json({ message: 'The database is unavailable. Check the MongoDB connection.' })
  }

  try {
    const analysis = await ResumeAnalysis.findOne({
      _id: request.params.analysisId,
      candidate: request.user.id,
    }).lean()

    if (!analysis) {
      return response.status(404).json({ message: 'Resume analysis not found.' })
    }

    return response.json({ analysis })
  } catch (error) {
    console.error('Unable to load resume analysis:', error.message)
    return response.status(500).json({ message: 'Unable to load this resume analysis right now.' })
  }
}

router.post('/analyze', ...candidateOnly, uploadResume, analyzeResume)
router.get('/analyses', ...candidateOnly, getAnalyses)
router.get('/analyses/:analysisId', ...candidateOnly, getAnalysisById)

module.exports = router