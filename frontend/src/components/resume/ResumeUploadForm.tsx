import { useEffect, useState, type ChangeEvent, type FormEvent } from 'react'
import { findJobs } from '../../services/jobService'
import { analyzeResume } from '../../services/resumeService'
import type { Job } from '../../types/jobs'
import type { ResumeAnalysis } from '../../types/resume'

interface ResumeUploadFormProps {
  onAnalysis?: (analysis: ResumeAnalysis) => void
}

const MAX_FILE_SIZE = 5 * 1024 * 1024

type JobContextMode = 'job' | 'description'

function ResumeUploadForm({ onAnalysis }: ResumeUploadFormProps) {
  const [activeJobs, setActiveJobs] = useState<Job[]>([])
  const [isLoadingJobs, setIsLoadingJobs] = useState(true)
  const [jobsError, setJobsError] = useState('')
  const [contextMode, setContextMode] = useState<JobContextMode>('job')
  const [selectedJobId, setSelectedJobId] = useState('')
  const [jobDescription, setJobDescription] = useState('')
  const [resumeFile, setResumeFile] = useState<File | null>(null)
  const [fileError, setFileError] = useState('')
  const [formError, setFormError] = useState('')
  const [notice, setNotice] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    let isActive = true

    findJobs()
      .then((jobs) => {
        if (isActive) setActiveJobs(jobs.filter((job) => job.isActive !== false))
      })
      .catch((error: unknown) => {
        if (isActive) {
          setJobsError(
            error instanceof Error ? error.message : 'Unable to load active jobs right now.',
          )
        }
      })
      .finally(() => {
        if (isActive) setIsLoadingJobs(false)
      })

    return () => {
      isActive = false
    }
  }, [])

  function handleFileChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.currentTarget.files?.[0] ?? null
    setResumeFile(null)
    setFileError('')
    setFormError('')
    setNotice('')

    if (!file) return

    if (
      !file.name.toLowerCase().endsWith('.pdf') ||
      file.type.toLowerCase() !== 'application/pdf'
    ) {
      setFileError('Choose a PDF file. Other file types are not accepted.')
      event.currentTarget.value = ''
      return
    }

    if (file.size > MAX_FILE_SIZE) {
      setFileError('The PDF must be 5 MB or smaller.')
      event.currentTarget.value = ''
      return
    }

    setResumeFile(file)
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setFormError('')
    setNotice('')

    if (!resumeFile) {
      setFileError('Choose a PDF resume before continuing.')
      return
    }

    if (contextMode === 'job' && !selectedJobId) {
      setFormError('Choose an active job or switch to paste a job description.')
      return
    }

    if (contextMode === 'description' && !jobDescription.trim()) {
      setFormError('Paste a job description or switch to select an active job.')
      return
    }

    setIsSubmitting(true)

    try {
      const analysis = await analyzeResume(resumeFile, contextMode === 'job'
        ? { jobId: selectedJobId }
        : { jobDescription: jobDescription.trim() })
      onAnalysis?.(analysis)
      setNotice('Resume submitted successfully.')
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unable to submit this resume.'

      if (message.startsWith('AI analysis is not implemented yet')) {
        setNotice('AI analysis is not available yet. The PDF was validated and its text was extracted; no analysis was created.')
      } else {
        setFormError(message)
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <section className="container py-4 py-md-5" aria-labelledby="resume-upload-title">
      <div className="card border-0 shadow-sm mx-auto" style={{ maxWidth: '760px' }}>
        <div className="card-body p-4 p-md-5">
          <p className="text-uppercase small fw-semibold text-success mb-2">Resume analyzer</p>
          <h1 className="h2 mb-2" id="resume-upload-title">Upload your resume</h1>
          <p className="text-secondary mb-4">
            Add a PDF resume and choose the role you want to explore.
          </p>

          <form onSubmit={handleSubmit} noValidate>
            <div className="mb-4">
              <label className="form-label fw-semibold" htmlFor="resume-file">
                Resume PDF
              </label>
              <input
                accept=".pdf,application/pdf"
                className={`form-control${fileError ? ' is-invalid' : ''}`}
                id="resume-file"
                onChange={handleFileChange}
                type="file"
              />
              <div className="form-text">PDF only, up to 5 MB.</div>
              {fileError && <div className="invalid-feedback d-block" role="alert">{fileError}</div>}
              {resumeFile && (
                <p className="small text-secondary mt-2 mb-0">
                  {resumeFile.name} · {(resumeFile.size / (1024 * 1024)).toFixed(2)} MB
                </p>
              )}
            </div>

            <fieldset className="mb-3">
              <legend className="form-label fw-semibold">Job context</legend>
              <div className="btn-group" role="group" aria-label="Choose job context">
                <button
                  aria-pressed={contextMode === 'job'}
                  className={`btn ${contextMode === 'job' ? 'btn-success' : 'btn-outline-secondary'}`}
                  onClick={() => setContextMode('job')}
                  type="button"
                >
                  Select an active job
                </button>
                <button
                  aria-pressed={contextMode === 'description'}
                  className={`btn ${contextMode === 'description' ? 'btn-success' : 'btn-outline-secondary'}`}
                  onClick={() => setContextMode('description')}
                  type="button"
                >
                  Paste a description
                </button>
              </div>
            </fieldset>

            {contextMode === 'job' ? (
              <div className="mb-4">
                <label className="form-label" htmlFor="resume-job">Active job</label>
                <select
                  className="form-select"
                  disabled={isLoadingJobs || activeJobs.length === 0}
                  id="resume-job"
                  onChange={(event) => setSelectedJobId(event.target.value)}
                  value={selectedJobId}
                >
                  <option value="">Select a job</option>
                  {activeJobs.map((job) => (
                    <option key={job.id} value={job.id}>
                      {job.title} · {job.companyName} · {job.location}
                    </option>
                  ))}
                </select>
                {isLoadingJobs && <div className="form-text">Loading active jobs…</div>}
                {jobsError && <div className="form-text text-danger" role="alert">{jobsError}</div>}
                {!isLoadingJobs && !jobsError && activeJobs.length === 0 && (
                  <div className="form-text">No active jobs found. Paste a job description instead.</div>
                )}
              </div>
            ) : (
              <div className="mb-4">
                <label className="form-label" htmlFor="resume-job-description">Job description</label>
                <textarea
                  className="form-control"
                  id="resume-job-description"
                  maxLength={12000}
                  onChange={(event) => setJobDescription(event.target.value)}
                  placeholder="Paste the job description here"
                  rows={6}
                  value={jobDescription}
                />
                <div className="form-text">{jobDescription.length}/12,000 characters</div>
              </div>
            )}

            {formError && <div className="alert alert-danger" role="alert">{formError}</div>}
            {notice && <div className="alert alert-info" role="status">{notice}</div>}

            <button className="btn btn-success w-100" disabled={isSubmitting} type="submit">
              {isSubmitting ? (
                <>
                  <span className="spinner-border spinner-border-sm me-2" aria-hidden="true" />
                  Uploading and extracting…
                </>
              ) : 'Upload and analyze resume'}
            </button>
          </form>
        </div>
      </div>
    </section>
  )
}

export default ResumeUploadForm