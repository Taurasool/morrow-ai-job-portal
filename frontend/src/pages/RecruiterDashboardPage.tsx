import { useEffect, useState, type FormEvent } from 'react'
import SiteHeader from '../components/common/SiteHeader'
import {
  createRecruiterJob,
  getJobApplicants,
  getRecruiterJobs,
  removeRecruiterJob,
  updateRecruiterApplicationStatus,
  updateRecruiterJob,
} from '../services/jobService'
import type { AuthUser } from '../types/auth'
import type {
  Job,
  JobApplicant,
  JobCategory,
  JobDraft,
  RecruiterApplicationStatus,
} from '../types/jobs'

interface RecruiterDashboardPageProps {
  user: AuthUser | null
  onLogout: () => void
}

const categories: JobCategory[] = [
  'Engineering',
  'Design',
  'Product',
  'Data & Analytics',
  'Marketing',
  'Sales',
  'Operations',
  'Customer Success',
  'Other',
]

const employmentTypes = ['Full-time', 'Part-time', 'Contract', 'Internship']

const emptyDraft: JobDraft = {
  title: '',
  companyName: '',
  location: '',
  category: '',
  employmentType: 'Full-time',
  salaryRange: '',
  description: '',
  requiredSkills: '',
  requirements: '',
}

const applicantStatuses: RecruiterApplicationStatus[] = [
  'Under review',
  'Interview',
  'Rejected',
]

function formatDate(date: string) {
  return new Intl.DateTimeFormat(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(new Date(date))
}

function draftFromJob(job: Job): JobDraft {
  return {
    title: job.title,
    companyName: job.companyName,
    location: job.location,
    category: job.category,
    employmentType: job.employmentType,
    salaryRange: job.salaryRange,
    description: job.description,
    requiredSkills: job.requiredSkills.join('\n'),
    requirements: job.requirements.join('\n'),
  }
}

function RecruiterDashboardPage({ user, onLogout }: RecruiterDashboardPageProps) {
  const isRecruiter = user?.role === 'Recruiter'
  const [jobs, setJobs] = useState<Job[]>([])
  const [selectedJobId, setSelectedJobId] = useState<string | null>(null)
  const [applicants, setApplicants] = useState<JobApplicant[]>([])
  const [draft, setDraft] = useState<JobDraft>(emptyDraft)
  const [editingJobId, setEditingJobId] = useState<string | null>(null)
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [isViewingApplicants, setIsViewingApplicants] = useState(false)
  const [isLoadingJobs, setIsLoadingJobs] = useState(false)
  const [isLoadingApplicants, setIsLoadingApplicants] = useState(false)
  const [reloadCount, setReloadCount] = useState(0)
  const [saving, setSaving] = useState(false)
  const [updatingApplicationId, setUpdatingApplicationId] = useState<string | null>(null)
  const [error, setError] = useState('')
  const [jobsError, setJobsError] = useState('')
  const [notice, setNotice] = useState('')

  const selectedJob = jobs.find((job) => job.id === selectedJobId) ?? null
  const activeJobCount = jobs.filter((job) => job.isActive !== false).length

  useEffect(() => {
    if (!isRecruiter) return

    let isActive = true
    setIsLoadingJobs(true)
    setJobsError('')
    getRecruiterJobs()
      .then((results) => {
        if (!isActive) return
        setJobs(results)
        setSelectedJobId((currentId) =>
          results.some((job) => job.id === currentId) ? currentId : results[0]?.id ?? null,
        )
      })
      .catch((requestError: unknown) => {
        if (isActive) {
          setJobsError(
            requestError instanceof Error
              ? requestError.message
              : 'Unable to load your job listings right now.',
          )
        }
      })
      .finally(() => {
        if (isActive) setIsLoadingJobs(false)
      })

    return () => {
      isActive = false
    }
  }, [isRecruiter, reloadCount])

  function openCreateForm() {
    setEditingJobId(null)
    setDraft({ ...emptyDraft })
    setIsFormOpen(true)
    setIsViewingApplicants(false)
    setError('')
    setNotice('')
  }

  function openEditForm(job: Job) {
    setSelectedJobId(job.id)
    setEditingJobId(job.id)
    setDraft(draftFromJob(job))
    setIsFormOpen(true)
    setIsViewingApplicants(false)
    setError('')
    setNotice('')
  }

  function openJob(job: Job) {
    setSelectedJobId(job.id)
    setIsFormOpen(false)
    setIsViewingApplicants(false)
    setApplicants([])
    setError('')
    setNotice('')
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setSaving(true)
    setError('')
    setNotice('')

    try {
      const savedJob = editingJobId
        ? await updateRecruiterJob(editingJobId, draft)
        : await createRecruiterJob(draft)

      setJobs((current) =>
        editingJobId
          ? current.map((job) => (job.id === savedJob.id ? savedJob : job))
          : [savedJob, ...current],
      )
      setSelectedJobId(savedJob.id)
      setIsFormOpen(false)
      setNotice(editingJobId ? 'Job listing updated.' : 'Job listing published.')
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : 'Unable to save this job listing right now.',
      )
    } finally {
      setSaving(false)
    }
  }

  async function handleRemove(job: Job) {
    const confirmed = window.confirm(
      `Remove “${job.title}” from public job search? Existing applications will be kept.`,
    )
    if (!confirmed) return

    setError('')
    setNotice('')
    try {
      const result = await removeRecruiterJob(job.id)
      setJobs((current) => current.map((item) =>
        item.id === job.id ? { ...item, isActive: false } : item,
      ))
      setNotice(result.message)
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : 'Unable to remove this job listing right now.',
      )
    }
  }

  async function showApplicants(job: Job) {
    setSelectedJobId(job.id)
    setIsFormOpen(false)
    setIsViewingApplicants(true)
    setIsLoadingApplicants(true)
    setApplicants([])
    setError('')
    setNotice('')

    try {
      setApplicants(await getJobApplicants(job.id))
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : 'Unable to load applicants right now.',
      )
    } finally {
      setIsLoadingApplicants(false)
    }
  }

  async function changeApplicationStatus(
    applicant: JobApplicant,
    status: RecruiterApplicationStatus,
  ) {
    setUpdatingApplicationId(applicant.id)
    setError('')
    setNotice('')

    try {
      await updateRecruiterApplicationStatus(applicant.id, status)
      setApplicants((current) => current.map((item) =>
        item.id === applicant.id ? { ...item, status } : item,
      ))
      setNotice(`Application status updated to ${status}.`)
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : 'Unable to update this application right now.',
      )
    } finally {
      setUpdatingApplicationId(null)
    }
  }

  function setDraftField<Key extends keyof JobDraft>(field: Key, value: JobDraft[Key]) {
    setDraft((current) => ({ ...current, [field]: value }))
  }

  function returnToRecruiterAfterAuth(isRegistration = false) {
    window.sessionStorage.setItem('postAuthHash', '#recruiter')
    if (isRegistration) window.sessionStorage.setItem('preferredAuthRole', 'Recruiter')
  }

  return (
    <>
      <SiteHeader user={user} onLogout={onLogout} />
      <main className="recruiter-page" id="top">
        <div className="page-shell">
          {!user ? (
            <section className="recruiter-access">
              <p className="eyebrow">For employers</p>
              <h1>Build a team with more context.</h1>
              <p>Sign in with a recruiter account or create one to manage job listings and review applicants.</p>
              <div className="recruiter-access-actions">
                <a href="#register" onClick={() => returnToRecruiterAfterAuth(true)}>Create recruiter account</a>
                <a href="#login" onClick={() => returnToRecruiterAfterAuth()}>Sign in</a>
              </div>
            </section>
          ) : !isRecruiter ? (
            <section className="recruiter-access">
              <p className="eyebrow">Recruiter workspace</p>
              <h1>This workspace is for recruiter accounts.</h1>
              <p>You’re signed in as a candidate. Sign out to access a recruiter account.</p>
              <button className="recruiter-secondary-button" onClick={onLogout} type="button">
                Sign out
              </button>
            </section>
          ) : (
            <>
              <div className="recruiter-heading">
                <div>
                  <p className="eyebrow">Recruiter workspace</p>
                  <h1>Manage your roles.</h1>
                  <p>Publish clear opportunities and review the people who apply.</p>
                </div>
                <button className="recruiter-primary-button" onClick={openCreateForm} type="button">
                  <span aria-hidden="true">＋</span> Post a role
                </button>
              </div>

              <div className="recruiter-summary" aria-label="Posting summary">
                <div>
                  <span>Active listings</span>
                  <strong>{isLoadingJobs ? '…' : jobsError ? '—' : activeJobCount}</strong>
                </div>
                <div>
                  <span>Total listings</span>
                  <strong>{isLoadingJobs ? '…' : jobsError ? '—' : jobs.length}</strong>
                </div>
              </div>

              {error && <p className="recruiter-error" role="alert">{error}</p>}
              {notice && <p className="recruiter-notice" role="status">{notice}</p>}

              <div className="recruiter-layout">
                <section className="recruiter-list-panel" aria-label="Your job listings">
                  <div className="recruiter-panel-heading">
                    <h2>Your listings</h2>
                    {!isLoadingJobs && !error && <span>{jobs.length}</span>}
                  </div>

                  {isLoadingJobs ? (
                    <div className="recruiter-loading" role="status">
                      <span className="spinner-border spinner-border-sm" aria-hidden="true" />
                      Loading listings…
                    </div>
                  ) : jobsError ? (
                    <div className="recruiter-list-empty" role="alert">
                      <p>{jobsError}</p>
                      <button onClick={() => setReloadCount((count) => count + 1)} type="button">
                        Try again
                      </button>
                    </div>
                  ) : jobs.length === 0 ? (
                    <div className="recruiter-list-empty">
                      <p>No job listings yet.</p>
                      <button onClick={openCreateForm} type="button">Post your first role</button>
                    </div>
                  ) : (
                    <div className="recruiter-list">
                      {jobs.map((job) => (
                        <article
                          className={`recruiter-job-item${selectedJobId === job.id ? ' is-selected' : ''}`}
                          key={job.id}
                        >
                          <button className="recruiter-job-select" onClick={() => openJob(job)} type="button">
                            <span className="recruiter-job-title">{job.title}</span>
                            <span className="recruiter-job-meta">{job.location} · {job.employmentType}</span>
                            <span className={`listing-state${job.isActive === false ? ' is-closed' : ''}`}>
                              {job.isActive === false ? 'Closed' : 'Published'}
                            </span>
                          </button>
                          <div className="recruiter-job-actions">
                            <button onClick={() => openEditForm(job)} type="button">Edit</button>
                            <button onClick={() => showApplicants(job)} type="button">Applicants</button>
                            {job.isActive !== false && (
                              <button className="remove-listing-button" onClick={() => handleRemove(job)} type="button">
                                Remove
                              </button>
                            )}
                          </div>
                        </article>
                      ))}
                    </div>
                  )}
                </section>

                <section className="recruiter-detail-panel" aria-label="Job management details">
                  {isFormOpen ? (
                    <form className="recruiter-job-form" onSubmit={handleSubmit}>
                      <div className="recruiter-panel-heading">
                        <div>
                          <p className="eyebrow">{editingJobId ? 'Edit listing' : 'New listing'}</p>
                          <h2>{editingJobId ? 'Update role details' : 'Create a job listing'}</h2>
                        </div>
                        <button className="recruiter-close-form" onClick={() => setIsFormOpen(false)} type="button" aria-label="Close job form">×</button>
                      </div>

                      <div className="recruiter-form-grid">
                        <label>
                          <span>Job title</span>
                          <input maxLength={120} minLength={3} onChange={(event) => setDraftField('title', event.target.value)} required value={draft.title} />
                        </label>
                        <label>
                          <span>Company</span>
                          <input maxLength={120} minLength={2} onChange={(event) => setDraftField('companyName', event.target.value)} required value={draft.companyName} />
                        </label>
                        <label>
                          <span>Category</span>
                          <select onChange={(event) => setDraftField('category', event.target.value as JobCategory | '')} required value={draft.category}>
                            <option value="">Select a category</option>
                            {categories.map((category) => <option key={category} value={category}>{category}</option>)}
                          </select>
                        </label>
                        <label>
                          <span>Location</span>
                          <input maxLength={120} minLength={2} onChange={(event) => setDraftField('location', event.target.value)} required value={draft.location} />
                        </label>
                        <label>
                          <span>Employment type</span>
                          <select onChange={(event) => setDraftField('employmentType', event.target.value)} value={draft.employmentType}>
                            {employmentTypes.map((type) => <option key={type} value={type}>{type}</option>)}
                          </select>
                        </label>
                        <label>
                          <span>Salary range <small>Optional</small></span>
                          <input maxLength={80} onChange={(event) => setDraftField('salaryRange', event.target.value)} placeholder="e.g. $80,000–$100,000" value={draft.salaryRange} />
                        </label>
                        <label className="form-full-width">
                          <span>Role description</span>
                          <textarea maxLength={12000} minLength={20} onChange={(event) => setDraftField('description', event.target.value)} required rows={5} value={draft.description} />
                        </label>
                        <label>
                          <span>Skills <small>One per line</small></span>
                          <textarea onChange={(event) => setDraftField('requiredSkills', event.target.value)} placeholder={'React\nTypeScript'} rows={3} value={draft.requiredSkills} />
                        </label>
                        <label>
                          <span>Requirements <small>One per line</small></span>
                          <textarea onChange={(event) => setDraftField('requirements', event.target.value)} placeholder={'Relevant experience\nClear communication'} rows={3} value={draft.requirements} />
                        </label>
                      </div>

                      {error && <p className="recruiter-error" role="alert">{error}</p>}
                      <div className="recruiter-form-actions">
                        <button className="recruiter-secondary-button" onClick={() => setIsFormOpen(false)} type="button">Cancel</button>
                        <button className="recruiter-primary-button" disabled={saving} type="submit">
                          {saving ? 'Saving…' : editingJobId ? 'Save changes' : 'Publish listing'}
                        </button>
                      </div>
                    </form>
                  ) : isViewingApplicants && selectedJob ? (
                    <div className="applicants-panel">
                      <div className="recruiter-panel-heading">
                        <div>
                          <p className="eyebrow">Applicants</p>
                          <h2>{selectedJob.title}</h2>
                        </div>
                        <button className="recruiter-back-button" onClick={() => setIsViewingApplicants(false)} type="button">Back to role</button>
                      </div>
                      {isLoadingApplicants ? (
                        <div className="recruiter-loading" role="status">
                          <span className="spinner-border spinner-border-sm" aria-hidden="true" />
                          Loading applicants…
                        </div>
                      ) : applicants.length === 0 ? (
                        <div className="recruiter-list-empty">
                          <p>No applications for this role yet.</p>
                        </div>
                      ) : (
                        <div className="applicant-list">
                          {applicants.map((applicant) => (
                            <article className="applicant-row" key={applicant.id}>
                              <div className="applicant-identity">
                                <span className="applicant-avatar" aria-hidden="true">{applicant.name.charAt(0).toUpperCase()}</span>
                                <span>
                                  <strong>{applicant.name}</strong>
                                  <a href={`mailto:${applicant.email}`}>{applicant.email}</a>
                                  <small>Applied {formatDate(applicant.appliedAt)}</small>
                                </span>
                              </div>
                              <label className="applicant-status-control">
                                <span className="visually-hidden">Status for {applicant.name}</span>
                                <select
                                  disabled={updatingApplicationId === applicant.id}
                                  onChange={(event) => changeApplicationStatus(applicant, event.target.value as RecruiterApplicationStatus)}
                                  value={applicant.status}
                                >
                                  <option value="Applied" disabled>Applied</option>
                                  {applicantStatuses.map((status) => <option key={status} value={status}>{status}</option>)}
                                </select>
                              </label>
                            </article>
                          ))}
                        </div>
                      )}
                    </div>
                  ) : selectedJob ? (
                    <div className="recruiter-role-overview">
                      <p className="eyebrow">Selected listing</p>
                      <h2>{selectedJob.title}</h2>
                      <p>{selectedJob.companyName} · {selectedJob.location}</p>
                      <span className={`listing-state${selectedJob.isActive === false ? ' is-closed' : ''}`}>
                        {selectedJob.isActive === false ? 'Closed' : 'Published'} · Posted {formatDate(selectedJob.postedAt)}
                      </span>
                      <div className="recruiter-overview-actions">
                        <button className="recruiter-primary-button" onClick={() => openEditForm(selectedJob)} type="button">Edit listing</button>
                        <button className="recruiter-secondary-button" onClick={() => showApplicants(selectedJob)} type="button">View applicants</button>
                      </div>
                    </div>
                  ) : (
                    <div className="recruiter-detail-empty">
                      <span aria-hidden="true">＋</span>
                      <h2>Your job workspace</h2>
                      <p>Create a listing to start receiving applications.</p>
                      <button className="recruiter-primary-button" onClick={openCreateForm} type="button">Post a role</button>
                    </div>
                  )}
                </section>
              </div>
            </>
          )}
        </div>
      </main>
    </>
  )
}

export default RecruiterDashboardPage