export type JobCategory =
  | 'Engineering'
  | 'Design'
  | 'Product'
  | 'Data & Analytics'
  | 'Marketing'
  | 'Sales'
  | 'Operations'
  | 'Customer Success'
  | 'Other'

export type ApplicationStatus = 'Applied' | 'Under review' | 'Interview' | 'Rejected'

export interface JobSearchFilters {
  search?: string
  category?: JobCategory | ''
  location?: string
}

export interface Job {
  id: string
  title: string
  companyName: string
  location: string
  category: JobCategory
  employmentType: string
  salaryRange: string
  description: string
  requirements: string[]
  requiredSkills: string[]
  postedAt: string
  isActive?: boolean
}

export interface JobApplication {
  id: string
  status: ApplicationStatus
  appliedAt: string
  job: Job
}

export interface JobDraft {
  title: string
  companyName: string
  location: string
  category: JobCategory | ''
  employmentType: string
  salaryRange: string
  description: string
  requiredSkills: string
  requirements: string
}

export type RecruiterApplicationStatus = 'Under review' | 'Interview' | 'Rejected'

export interface JobApplicant {
  id: string
  name: string
  email: string
  status: ApplicationStatus
  appliedAt: string
}