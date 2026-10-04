import { apiRequest } from './apiClient'
import type { ResumeAnalysis, ResumeAnalysisHistoryItem } from '../types/resume'

function getCandidateToken() {
  const token = window.localStorage.getItem('authToken')
  if (!token) {
    throw new Error('Sign in with a candidate account to use resume analysis.')
  }

  return token
}

export async function analyzeResume(
  file: File,
  context: { jobId?: string; jobDescription?: string } = {},
): Promise<ResumeAnalysis> {
  const formData = new FormData()
  formData.append('resume', file)
  if (context.jobId) formData.append('jobId', context.jobId)
  if (context.jobDescription?.trim()) {
    formData.append('jobDescription', context.jobDescription.trim())
  }

  const response = await apiRequest<{ analysis: ResumeAnalysis }>(
    '/resumes/analyze',
    { method: 'POST', body: formData },
    getCandidateToken(),
  )

  return response.analysis
}

export async function getResumeAnalyses(): Promise<ResumeAnalysisHistoryItem[]> {
  const response = await apiRequest<{ analyses: ResumeAnalysisHistoryItem[] }>(
    '/resumes/analyses',
    {},
    getCandidateToken(),
  )

  return response.analyses
}

export async function getResumeAnalysis(analysisId: string): Promise<ResumeAnalysis> {
  const response = await apiRequest<{ analysis: ResumeAnalysis }>(
    `/resumes/analyses/${encodeURIComponent(analysisId)}`,
    {},
    getCandidateToken(),
  )

  return response.analysis
}