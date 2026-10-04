const mongoose = require('mongoose')
const Job = require('../models/Job')

function escapeRegex(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

function toJobResponse(job) {
  return {
    id: job._id.toString(),
    title: job.title,
    companyName: job.companyName,
    location: job.location,
    category: job.category,
    employmentType: job.employmentType,
    salaryRange: job.salaryRange,
    description: job.description,
    requirements: job.requirements,
    requiredSkills: job.requiredSkills,
    postedAt: job.createdAt,
    isActive: job.isActive !== false,
  }
}

function checkDatabase(response) {
  if (mongoose.connection.readyState !== 1) {
    response.status(503).json({ message: 'The database is unavailable. Check the MongoDB connection.' })
    return false
  }

  return true
}

function getJobFields(body = {}) {
  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    body = {}
  }

  const toList = (value) => {
    const items = Array.isArray(value) ? value : typeof value === 'string' ? value.split(/\r?\n/) : []
    return items
      .filter((item) => typeof item === 'string')
      .map((item) => item.trim())
      .filter(Boolean)
      .slice(0, 20)
  }

  return {
    title: typeof body.title === 'string' ? body.title.trim() : '',
    companyName: typeof body.companyName === 'string' ? body.companyName.trim() : '',
    location: typeof body.location === 'string' ? body.location.trim() : '',
    category: typeof body.category === 'string' ? body.category : '',
    employmentType: typeof body.employmentType === 'string' ? body.employmentType : '',
    salaryRange: typeof body.salaryRange === 'string' ? body.salaryRange.trim() : '',
    description: typeof body.description === 'string' ? body.description.trim() : '',
    requiredSkills: toList(body.requiredSkills),
    requirements: toList(body.requirements),
  }
}

function validateJobFields(fields) {
  const categories = Job.schema.path('category').enumValues
  const employmentTypes = Job.schema.path('employmentType').enumValues

  if (
    fields.title.length < 3 ||
    fields.title.length > 120 ||
    fields.companyName.length < 2 ||
    fields.companyName.length > 120 ||
    fields.location.length < 2 ||
    fields.location.length > 120 ||
    !categories.includes(fields.category) ||
    !employmentTypes.includes(fields.employmentType) ||
    fields.salaryRange.length > 80 ||
    fields.description.length < 20 ||
    fields.description.length > 12000 ||
    [...fields.requiredSkills, ...fields.requirements].some((item) => item.length > 160)
  ) {
    return 'Check the job details. Add a title, company, location, valid category and type, and a description of at least 20 characters.'
  }

  return ''
}

function validJobId(request, response) {
  if (!mongoose.isValidObjectId(request.params.jobId)) {
    response.status(400).json({ message: 'This job ID is invalid.' })
    return false
  }

  return true
}

async function getJobs(request, response) {
  if (!checkDatabase(response)) return

  const { search, category, location } = request.query
  const filter = { isActive: true }

  if (typeof search === 'string' && search.trim()) {
    const pattern = new RegExp(escapeRegex(search.trim()), 'i')
    filter.$or = [
      { title: pattern },
      { companyName: pattern },
      { description: pattern },
    ]
  }

  if (typeof category === 'string' && category.trim()) {
    filter.category = category.trim()
  }

  if (typeof location === 'string' && location.trim()) {
    filter.location = new RegExp(escapeRegex(location.trim()), 'i')
  }

  try {
    const jobs = await Job.find(filter).sort({ createdAt: -1 }).limit(100).lean()
    return response.json({ jobs: jobs.map(toJobResponse) })
  } catch (error) {
    console.error('Unable to load jobs:', error.message)
    return response.status(500).json({ message: 'Unable to load jobs right now.' })
  }
}

async function getJobById(request, response) {
  if (!checkDatabase(response)) return
  if (!mongoose.isValidObjectId(request.params.jobId)) {
    return response.status(400).json({ message: 'This job ID is invalid.' })
  }

  try {
    const job = await Job.findOne({ _id: request.params.jobId, isActive: true }).lean()
    if (!job) {
      return response.status(404).json({ message: 'This job is no longer available.' })
    }

    return response.json({ job: toJobResponse(job) })
  } catch (error) {
    console.error('Unable to load job:', error.message)
    return response.status(500).json({ message: 'Unable to load this job right now.' })
  }
}

async function getRecruiterJobs(request, response) {
  if (!checkDatabase(response)) return

  try {
    const jobs = await Job.find({ postedBy: request.user.id }).sort({ createdAt: -1 }).lean()
    return response.json({ jobs: jobs.map(toJobResponse) })
  } catch (error) {
    console.error('Unable to load recruiter jobs:', error.message)
    return response.status(500).json({ message: 'Unable to load your job listings right now.' })
  }
}

async function createJob(request, response) {
  if (!checkDatabase(response)) return

  const fields = getJobFields(request.body)
  const validationMessage = validateJobFields(fields)
  if (validationMessage) {
    return response.status(400).json({ message: validationMessage })
  }

  try {
    const job = await Job.create({ ...fields, postedBy: request.user.id })
    return response.status(201).json({ job: toJobResponse(job) })
  } catch (error) {
    if (error.name === 'ValidationError') {
      return response.status(400).json({ message: 'Some job details are invalid.' })
    }

    console.error('Unable to create job:', error.message)
    return response.status(500).json({ message: 'Unable to create this job listing right now.' })
  }
}

async function updateJob(request, response) {
  if (!checkDatabase(response)) return
  if (!validJobId(request, response)) return

  const fields = getJobFields(request.body)
  const validationMessage = validateJobFields(fields)
  if (validationMessage) {
    return response.status(400).json({ message: validationMessage })
  }

  try {
    const job = await Job.findOneAndUpdate(
      { _id: request.params.jobId, postedBy: request.user.id },
      fields,
      { new: true, runValidators: true },
    ).lean()

    if (!job) {
      return response.status(404).json({ message: 'This job listing was not found.' })
    }

    return response.json({ job: toJobResponse(job) })
  } catch (error) {
    if (error.name === 'ValidationError') {
      return response.status(400).json({ message: 'Some job details are invalid.' })
    }

    console.error('Unable to update job:', error.message)
    return response.status(500).json({ message: 'Unable to update this job listing right now.' })
  }
}

async function deleteJob(request, response) {
  if (!checkDatabase(response)) return
  if (!validJobId(request, response)) return

  try {
    const job = await Job.findOneAndUpdate(
      { _id: request.params.jobId, postedBy: request.user.id, isActive: true },
      { isActive: false },
      { new: true },
    )

    if (!job) {
      return response.status(404).json({ message: 'This active job listing was not found.' })
    }

    return response.json({ message: 'The listing was removed from job search. Existing applications were kept.' })
  } catch (error) {
    console.error('Unable to remove job:', error.message)
    return response.status(500).json({ message: 'Unable to remove this job listing right now.' })
  }
}

module.exports = {
  createJob,
  deleteJob,
  getJobById,
  getJobs,
  getRecruiterJobs,
  toJobResponse,
  updateJob,
}