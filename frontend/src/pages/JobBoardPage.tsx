import { useEffect, useState, type FormEvent } from 'react'
import SiteHeader from '../components/common/SiteHeader'
import { applyForJob, findJobs, getMyApplications } from '../services/jobService'
import type { AuthUser } from '../types/auth'
import type { Job, JobApplication, JobCategory, JobSearchFilters } from '../types/jobs'

interface JobBoardPageProps {
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

const emptyFilters: JobSearchFilters = { search: '', category: '', location: '' }

function formatDate(date: string) {
  return new Intl.DateTimeFormat(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(new Date(date))
}

function JobBoardPage({ user, onLogout }: JobBoardPageProps) {
  const [activeTab, setActiveTab] = useState<'jobs' | 'applications'>(
    window.location.hash === '#applications' ? 'applications' : 'jobs',
  )
  const [formFilters, setFormFilters] = useState<JobSearchFilters>(emptyFilters)
  const [filters, setFilters] = useState<JobSearchFilters>(emptyFilters)
  const [jobs, setJobs] = useState<Job[]>([])
  const [selectedJobId, setSelectedJobId] = useState<string | null>(null)
  const [isLoadingJobs, setIsLoadingJobs] = useState(true)
  const [jobsError, setJobsError] = useState('')
  const [applications, setApplications] = useState<JobApplication[]>([])
  const [appliedJobIds, setAppliedJobIds] = useState<Set<string>>(new Set())
  const [isLoadingApplications, setIsLoadingApplications] = useState(false)
  const [applicationsError, setApplicationsError] = useState('')
  const [applyingJobId, setApplyingJobId] = useState<string | null>(null)
  const [feedback, setFeedback] = useState('')

  const selectedJob = jobs.find((job) => job.id === selectedJobId) ?? null

  useEffect(() => {
    function updateActiveTab() {
      setActiveTab(window.location.hash === '#applications' ? 'applications' : 'jobs')
    }

    window.addEventListener('hashchange', updateActiveTab)
    return () => window.removeEventListener('hashchange', updateActiveTab)
  }, [])

  useEffect(() => {
    let isActive = true
    setIsLoadingJobs(true)
    setJobsError('')

    findJobs(filters)
      .then((results) => {
        if (!isActive) return
        setJobs(results)
        setSelectedJobId((currentId) =>
          results.some((job) => job.id === currentId) ? currentId : results[0]?.id ?? null,
        )
      })
      .catch((error: unknown) => {
        if (isActive) {
          setJobsError(
            error instanceof Error ? error.message : 'Unable to load jobs right now.',
          )
        }
      })
      .finally(() => {
        if (isActive) setIsLoadingJobs(false)
      })

    return () => {
      isActive = false
    }
  }, [filters])

  useEffect(() => {
    let isActive = true

    if (!user || user.role !== 'Candidate') {
      setApplications([])
      setAppliedJobIds(new Set())
      setApplicationsError('')
      return () => {
        isActive = false
      }
    }

    setIsLoadingApplications(true)
    setApplicationsError('')
    getMyApplications()
      .then((results) => {
        if (!isActive) return
        setApplications(results)
        setAppliedJobIds(new Set(results.map((application) => application.job.id)))
      })
      .catch((error: unknown) => {
        if (isActive) {
          setApplicationsError(
            error instanceof Error
              ? error.message
              : 'Unable to load your applications right now.',
          )
        }
      })
      .finally(() => {
        if (isActive) setIsLoadingApplications(false)
      })

    return () => {
      isActive = false
    }
  }, [user])

  function handleSearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setFilters({ ...formFilters })
    setFeedback('')
  }

  function clearFilters() {
    setFormFilters(emptyFilters)
    setFilters(emptyFilters)
    setFeedback('')
  }

  function changeTab(tab: 'jobs' | 'applications') {
    setActiveTab(tab)
    window.location.hash = tab === 'jobs' ? '#jobs' : '#applications'
  }

  async function handleApply(job: Job) {
    setFeedback('')

    if (!user) {
      window.sessionStorage.setItem('postAuthHash', '#jobs')
      window.location.hash = '#login'
      return
    }

    if (user.role !== 'Candidate') {
      setFeedback('Applications are available to candidate accounts.')
      return
    }

    if (appliedJobIds.has(job.id)) {
      setFeedback('You have already applied for this role.')
      return
    }

    setApplyingJobId(job.id)
    try {
      const application = await applyForJob(job.id)
      setApplications((current) => [application, ...current])
      setAppliedJobIds((current) => new Set(current).add(job.id))
      setFeedback('Application submitted.')
    } catch (error) {
      setFeedback(
        error instanceof Error ? error.message : 'Unable to submit your application right now.',
      )
    } finally {
      setApplyingJobId(null)
    }
  }

  function switchToLogin() {
    window.sessionStorage.setItem('postAuthHash', '#jobs')
    window.location.hash = '#login'
  }

  return (
    <>
      <SiteHeader user={user} onLogout={onLogout} />
      <main className="jobs-page" id="top">
        <div className="page-shell">
          <div className="jobs-heading">
            <div>
              <p className="eyebrow">The next step starts here</p>
              <h1>Find work that fits.</h1>
              <p className="jobs-subtitle">
                Explore current roles and keep your applications together.
              </p>
            </div>
            {user && (
              <div className="account-summary">
                <span className="account-initial" aria-hidden="true">
                  {user.name.charAt(0).toUpperCase()}
                </span>
                <span>
                  <strong>{user.name}</strong>
                  <small>{user.role} account</small>
                </span>
              </div>
            )}
          </div>

          <div className="job-tabs" role="tablist" aria-label="Candidate workspace">
            <button
              aria-selected={activeTab === 'jobs'}
              className={activeTab === 'jobs' ? 'is-active' : ''}
              onClick={() => changeTab('jobs')}
              role="tab"
              type="button"
            >
              Find jobs
            </button>
            <button
              aria-selected={activeTab === 'applications'}
              className={activeTab === 'applications' ? 'is-active' : ''}
              onClick={() => changeTab('applications')}
              role="tab"
              type="button"
            >
              My applications
              {user?.role === 'Candidate' && applications.length > 0 && (
                <span className="tab-count">{applications.length}</span>
              )}
            </button>
          </div>

          {activeTab === 'jobs' ? (
            <>
              <form className="job-filter-form" onSubmit={handleSearch}>
                <label className="job-filter search-filter">
                  <span>Keyword</span>
                  <input
                    onChange={(event) =>
                      setFormFilters((current) => ({ ...current, search: event.target.value }))
                    }
                    placeholder="Job title or company"
                    type="search"
                    value={formFilters.search}
                  />
                </label>
                <label className="job-filter">
                  <span>Category</span>
                  <select
                    onChange={(event) =>
                      setFormFilters((current) => ({
                        ...current,
                        category: event.target.value as JobCategory | '',
                      }))
                    }
                    value={formFilters.category}
                  >
                    <option value="">All categories</option>
                    {categories.map((category) => (
                      <option key={category} value={category}>
                        {category}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="job-filter">
                  <span>Location</span>
                  <input
                    onChange={(event) =>
                      setFormFilters((current) => ({ ...current, location: event.target.value }))
                    }
                    placeholder="City or region"
                    type="search"
                    value={formFilters.location}
                  />
                </label>
                <button className="job-search-button" type="submit">
                  Search roles <span aria-hidden="true">↗</span>
                </button>
              </form>

              {feedback && (
                <p className="job-feedback" role="status">
                  {feedback}
                  {!user && (
                    <>
                      {' '}
                      <button onClick={switchToLogin} type="button">Sign in</button> to apply.
                    </>
                  )}
                </p>
              )}

              {jobsError && <p className="job-error" role="alert">{jobsError}</p>}

              <div className="job-results-heading">
                <h2>Open roles</h2>
                {!isLoadingJobs && !jobsError && (
                  <span>{jobs.length} {jobs.length === 1 ? 'role' : 'roles'}</span>
                )}
                {(filters.search || filters.category || filters.location) && (
                  <button className="clear-filters" onClick={clearFilters} type="button">
                    Clear filters
                  </button>
                )}
              </div>

              {isLoadingJobs ? (
                <div className="jobs-loading" role="status">
                  <span className="spinner-border spinner-border-sm" aria-hidden="true" />
                  Loading current roles…
                </div>
              ) : jobsError ? null : jobs.length === 0 ? (
                <div className="jobs-empty">
                  <span className="empty-mark" aria-hidden="true">↗</span>
                  <h3>{filters.search || filters.category || filters.location ? 'No roles match those filters.' : 'No open roles yet.'}</h3>
                  <p>
                    {filters.search || filters.category || filters.location
                      ? 'Try a broader search or clear the filters.'
                      : 'New job postings will appear here when recruiters publish them.'}
                  </p>
                  {(filters.search || filters.category || filters.location) && (
                    <button className="text-link" onClick={clearFilters} type="button">
                      Clear all filters <span aria-hidden="true">↗</span>
                    </button>
                  )}
                </div>
              ) : (
                <div className="job-board-layout">
                  <section className="job-list" aria-label="Job search results">
                    {jobs.map((job) => (
                      <button
                        aria-pressed={selectedJobId === job.id}
                        className={`job-listing${selectedJobId === job.id ? ' is-selected' : ''}`}
                        key={job.id}
                        onClick={() => {
                          setSelectedJobId(job.id)
                          setFeedback('')
                        }}
                        type="button"
                      >
                        <span className="job-listing-topline">
                          <span className="job-category-label">{job.category}</span>
                          {appliedJobIds.has(job.id) && <span className="applied-label">Applied</span>}
                        </span>
                        <strong className="job-listing-title">{job.title}</strong>
                        <span className="job-company">{job.companyName}</span>
                        <span className="job-listing-meta">
                          <span>{job.location}</span>
                          <span>{job.employmentType}</span>
                        </span>
                        <span className="job-listing-date">Posted {formatDate(job.postedAt)}</span>
                      </button>
                    ))}
                  </section>

                  <aside className="job-detail" aria-label="Selected job details">
                    {selectedJob ? (
                      <>
                        <p className="eyebrow">Role details</p>
                        <span className="detail-category">{selectedJob.category}</span>
                        <h2>{selectedJob.title}</h2>
                        <p className="detail-company">{selectedJob.companyName}</p>
                        <div className="detail-meta">
                          <span>{selectedJob.location}</span>
                          <span>{selectedJob.employmentType}</span>
                          {selectedJob.salaryRange && <span>{selectedJob.salaryRange}</span>}
                        </div>
                        <button
                          className="apply-button"
                          disabled={applyingJobId === selectedJob.id || appliedJobIds.has(selectedJob.id)}
                          onClick={() => handleApply(selectedJob)}
                          type="button"
                        >
                          {applyingJobId === selectedJob.id
                            ? 'Submitting…'
                            : appliedJobIds.has(selectedJob.id)
                              ? 'Application submitted'
                              : 'Apply for this role'}
                          {!appliedJobIds.has(selectedJob.id) && <span aria-hidden="true">↗</span>}
                        </button>
                        <p className="detail-posted">Posted {formatDate(selectedJob.postedAt)}</p>
                        <div className="detail-description">
                          <h3>About the role</h3>
                          <p>{selectedJob.description}</p>
                        </div>
                        {selectedJob.requiredSkills.length > 0 && (
                          <div className="detail-skills">
                            <h3>Skills</h3>
                            <ul>
                              {selectedJob.requiredSkills.map((skill) => <li key={skill}>{skill}</li>)}
                            </ul>
                          </div>
                        )}
                        {selectedJob.requirements.length > 0 && (
                          <div className="detail-requirements">
                            <h3>What you’ll bring</h3>
                            <ul>
                              {selectedJob.requirements.map((requirement) => (
                                <li key={requirement}>{requirement}</li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </>
                    ) : (
                      <div className="detail-placeholder">
                        <span aria-hidden="true">↗</span>
                        <p>Select a role to see the details.</p>
                      </div>
                    )}
                  </aside>
                </div>
              )}
            </>
          ) : (
            <section className="applications-panel" aria-label="My applications">
              {!user ? (
                <div className="jobs-empty">
                  <h2>Sign in to see your applications.</h2>
                  <p>Applications are saved to your candidate account.</p>
                  <a className="application-sign-in" href="#login">Sign in</a>
                </div>
              ) : user.role !== 'Candidate' ? (
                <div className="jobs-empty">
                  <h2>This view is for candidate accounts.</h2>
                  <p>Recruiter application review will be part of the recruiter module.</p>
                </div>
              ) : isLoadingApplications ? (
                <div className="jobs-loading" role="status">
                  <span className="spinner-border spinner-border-sm" aria-hidden="true" />
                  Loading your applications…
                </div>
              ) : applicationsError ? (
                <p className="job-error" role="alert">{applicationsError}</p>
              ) : applications.length === 0 ? (
                <div className="jobs-empty">
                  <span className="empty-mark" aria-hidden="true">↗</span>
                  <h2>No applications yet.</h2>
                  <p>Roles you apply for will be collected here.</p>
                  <button className="text-link" onClick={() => changeTab('jobs')} type="button">
                    Browse open roles <span aria-hidden="true">↗</span>
                  </button>
                </div>
              ) : (
                <div className="application-list">
                  {applications.map((application) => (
                    <article className="application-row" key={application.id}>
                      <div>
                        <p className="job-category-label">{application.job.category}</p>
                        <h2>{application.job.title}</h2>
                        <p>{application.job.companyName} · {application.job.location}</p>
                      </div>
                      <div className="application-status-block">
                        <span className={`application-status status-${application.status.toLowerCase().replaceAll(' ', '-')}`}>
                          {application.status}
                        </span>
                        <small>Applied {formatDate(application.appliedAt)}</small>
                      </div>
                    </article>
                  ))}
                </div>
              )}
            </section>
          )}
        </div>
      </main>
    </>
  )
}

export default JobBoardPage