export interface ResumeAnalysis {
  _id: string
  candidate: string
  job: string | null
  score: number | null
  matchedSkills: string[]
  missingSkills: string[]
  summary: string
  suggestions: string[]
  interviewQuestions: string[]
  createdAt: string
  updatedAt: string
}

export type ResumeAnalysisHistoryItem = ResumeAnalysis