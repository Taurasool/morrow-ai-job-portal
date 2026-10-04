import { apiRequest } from './apiClient'
import type {
  Job,
  JobApplicant,
  JobApplication,
  JobDraft,
  JobSearchFilters,
  RecruiterApplicationStatus,
} from '../types/jobs'

export async function findJobs(filters: JobSearchFilters = {}) {
  const query = new URLSearchParams()
  if (filters.search?.trim()) query.set('search', filters.search.trim())
  if (filters.category) query.set('category', filters.category)
  if (filters.location?.trim()) query.set('location', filters.location.trim())

  const suffix = query.size > 0 ? `?${query.toString()}` : ''
  const response = await apiRequest<{ jobs: Job[] }>(`/jobs${suffix}`)
  return response.jobs
}

export async function getMyApplications() {
  const token = window.localStorage.getItem('authToken')
  if (!token) throw new Error('Sign in with a candidate account to view applications.')

  const response = await apiRequest<{ applications: JobApplication[] }>(
    '/applications/me',
    {},
    token,
  )
  return response.applications
}

export async function applyForJob(jobId: string) {
  const token = window.localStorage.getItem('authToken')
  if (!token) throw new Error('Sign in with a candidate account to apply.')

  const response = await apiRequest<{ application: JobApplication }>(
    `/jobs/${encodeURIComponent(jobId)}/apply`,
    { method: 'POST' },
    token,
  )
  return response.application
}

export async function getRecruiterJobs() {
  const token = window.localStorage.getItem('authToken')
  if (!token) throw new Error('Sign in with a recruiter account to manage job listings.')

  const response = await apiRequest<{ jobs: Job[] }>('/jobs/mine', {}, token)
  return response.jobs
}

export async function createRecruiterJob(details: JobDraft) {
  const token = window.localStorage.getItem('authToken')
  if (!token) throw new Error('Sign in with a recruiter account to post a job.')

  const response = await apiRequest<{ job: Job }>(
    '/jobs',
    { method: 'POST', body: JSON.stringify(details) },
    token,
  )
  return response.job
}

export async function updateRecruiterJob(jobId: string, details: JobDraft) {
  const token = window.localStorage.getItem('authToken')
  if (!token) throw new Error('Sign in with a recruiter account to update a job.')

  const response = await apiRequest<{ job: Job }>(
    `/jobs/${encodeURIComponent(jobId)}`,
    { method: 'PUT', body: JSON.stringify(details) },
    token,
  )
  return response.job
}

export async function removeRecruiterJob(jobId: string) {
  const token = window.localStorage.getItem('authToken')
  if (!token) throw new Error('Sign in with a recruiter account to remove a job.')

  return apiRequest<{ message: string }>(
    `/jobs/${encodeURIComponent(jobId)}`,
    { method: 'DELETE' },
    token,
  )
}

export async function getJobApplicants(jobId: string) {
  const token = window.localStorage.getItem('authToken')
  if (!token) throw new Error('Sign in with a recruiter account to view applicants.')

  const response = await apiRequest<{ applicants: JobApplicant[] }>(
    `/jobs/${encodeURIComponent(jobId)}/applicants`,
    {},
    token,
  )
  return response.applicants
}

export async function updateRecruiterApplicationStatus(
  applicationId: string,
  status: RecruiterApplicationStatus,
) {
  const token = window.localStorage.getItem('authToken')
  if (!token) throw new Error('Sign in with a recruiter account to update application status.')

  const response = await apiRequest<{ application: { id: string; status: RecruiterApplicationStatus } }>(
    `/applications/${encodeURIComponent(applicationId)}/status`,
    { method: 'PATCH', body: JSON.stringify({ status }) },
    token,
  )
  return response.application
}