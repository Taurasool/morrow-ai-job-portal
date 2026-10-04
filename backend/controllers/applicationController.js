const mongoose = require('mongoose')
const Application = require('../models/Application')
const Job = require('../models/Job')
const { toJobResponse } = require('./jobController')

function checkDatabase(response) {
  if (mongoose.connection.readyState !== 1) {
    response.status(503).json({ message: 'The database is unavailable. Check the MongoDB connection.' })
    return false
  }

  return true
}

function toApplicationResponse(application, job) {
  return {
    id: application._id.toString(),
    status: application.status,
    appliedAt: application.createdAt,
    job: toJobResponse(job),
  }
}

async function applyForJob(request, response) {
  if (!checkDatabase(response)) return
  if (!mongoose.isValidObjectId(request.params.jobId)) {
    return response.status(400).json({ message: 'This job ID is invalid.' })
  }

  try {
    const job = await Job.findOne({ _id: request.params.jobId, isActive: true }).lean()
    if (!job) {
      return response.status(404).json({ message: 'This job is no longer available.' })
    }

    const existingApplication = await Application.findOne({
      candidate: request.user.id,
      job: job._id,
    })
    if (existingApplication) {
      return response.status(409).json({ message: 'You have already applied for this job.' })
    }

    const application = await Application.create({
      candidate: request.user.id,
      job: job._id,
    })

    return response.status(201).json({
      application: toApplicationResponse(application, job),
    })
  } catch (error) {
    if (error.code === 11000) {
      return response.status(409).json({ message: 'You have already applied for this job.' })
    }

    console.error('Unable to submit application:', error.message)
    return response.status(500).json({ message: 'Unable to submit your application right now.' })
  }
}

async function getMyApplications(request, response) {
  if (!checkDatabase(response)) return

  try {
    const applications = await Application.find({ candidate: request.user.id })
      .sort({ createdAt: -1 })
      .populate('job')
      .lean()

    return response.json({
      applications: applications
        .filter((application) => application.job)
        .map((application) => toApplicationResponse(application, application.job)),
    })
  } catch (error) {
    console.error('Unable to load applications:', error.message)
    return response.status(500).json({ message: 'Unable to load your applications right now.' })
  }
}

async function getApplicantsForJob(request, response) {
  if (!checkDatabase(response)) return
  if (!mongoose.isValidObjectId(request.params.jobId)) {
    return response.status(400).json({ message: 'This job ID is invalid.' })
  }

  try {
    const job = await Job.findOne({
      _id: request.params.jobId,
      postedBy: request.user.id,
    }).select('_id')

    if (!job) {
      return response.status(404).json({ message: 'This job listing was not found.' })
    }

    const applications = await Application.find({ job: job._id })
      .sort({ createdAt: -1 })
      .populate('candidate', 'name email')
      .lean()

    return response.json({
      applicants: applications.map((application) => ({
        id: application._id.toString(),
        name: application.candidate?.name || 'Candidate account unavailable',
        email: application.candidate?.email || '',
        status: application.status,
        appliedAt: application.createdAt,
      })),
    })
  } catch (error) {
    console.error('Unable to load applicants:', error.message)
    return response.status(500).json({ message: 'Unable to load applicants right now.' })
  }
}

async function updateApplicationStatus(request, response) {
  if (!checkDatabase(response)) return
  if (!mongoose.isValidObjectId(request.params.applicationId)) {
    return response.status(400).json({ message: 'This application ID is invalid.' })
  }

  const allowedStatuses = ['Under review', 'Interview', 'Rejected']
  if (!allowedStatuses.includes(request.body?.status)) {
    return response.status(400).json({ message: 'Choose a valid application status.' })
  }

  try {
    const application = await Application.findById(request.params.applicationId).populate('job')
    if (!application?.job || application.job.postedBy.toString() !== request.user.id) {
      return response.status(404).json({ message: 'This application was not found for your job listings.' })
    }

    application.status = request.body.status
    await application.save()

    return response.json({
      application: {
        id: application._id.toString(),
        status: application.status,
        appliedAt: application.createdAt,
      },
    })
  } catch (error) {
    console.error('Unable to update application status:', error.message)
    return response.status(500).json({ message: 'Unable to update this application right now.' })
  }
}

module.exports = {
  applyForJob,
  getApplicantsForJob,
  getMyApplications,
  updateApplicationStatus,
}