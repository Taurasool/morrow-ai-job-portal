import { useEffect, useState } from 'react'
import SiteHeader from '../components/common/SiteHeader'
import ResumeAnalysisHistory from '../components/resume/ResumeAnalysisHistory'
import ResumeAnalysisResults from '../components/resume/ResumeAnalysisResults'
import ResumeUploadForm from '../components/resume/ResumeUploadForm'
import { getResumeAnalyses } from '../services/resumeService'
import type { AuthUser } from '../types/auth'
import type { ResumeAnalysis, ResumeAnalysisHistoryItem } from '../types/resume'

interface ResumeAnalyzerPageProps {
  user: AuthUser
  onLogout: () => void
}

function ResumeAnalyzerPage({ user, onLogout }: ResumeAnalyzerPageProps) {
  const [analyses, setAnalyses] = useState<ResumeAnalysisHistoryItem[]>([])
  const [currentAnalysis, setCurrentAnalysis] = useState<ResumeAnalysis | null>(null)
  const [isLoadingHistory, setIsLoadingHistory] = useState(true)
  const [historyError, setHistoryError] = useState('')
  const [historyRequest, setHistoryRequest] = useState(0)

  useEffect(() => {
    if (user.role !== 'Candidate') return

    let isActive = true
    setIsLoadingHistory(true)
    setHistoryError('')

    getResumeAnalyses()
      .then((items) => {
        if (isActive) setAnalyses(items)
      })
      .catch((error: unknown) => {
        if (isActive) {
          setHistoryError(
            error instanceof Error ? error.message : 'Unable to load resume analysis history.',
          )
        }
      })
      .finally(() => {
        if (isActive) setIsLoadingHistory(false)
      })

    return () => {
      isActive = false
    }
  }, [user.role, historyRequest])

  function handleAnalysis(analysis: ResumeAnalysis) {
    setCurrentAnalysis(analysis)
    setHistoryRequest((request) => request + 1)
  }

  return (
    <>
      <SiteHeader user={user} onLogout={onLogout} />
      {user.role !== 'Candidate' ? (
        <main className="container py-4 py-md-5">
          <div className="alert alert-warning mx-auto" role="alert" style={{ maxWidth: '760px' }}>
            <h1 className="h4">Candidate access only</h1>
            <p className="mb-3">The Resume Analyzer is available to candidate accounts.</p>
            <a className="btn btn-outline-secondary" href="#jobs">Return to jobs</a>
          </div>
        </main>
      ) : (
        <main>
          <header className="container pt-4 pt-md-5">
            <div className="mx-auto" style={{ maxWidth: '900px' }}>
              <p className="text-uppercase small fw-semibold text-success mb-2">Candidate workspace</p>
              <h1 className="h2 mb-2">Resume Analyzer</h1>
              <p className="text-secondary mb-0">
                Upload a PDF and compare it with a role or job description.
              </p>
            </div>
          </header>

          <ResumeUploadForm onAnalysis={handleAnalysis} />

          {currentAnalysis && <ResumeAnalysisResults analysis={currentAnalysis} />}

          {isLoadingHistory ? (
            <div className="container py-4" role="status">
              <div className="mx-auto d-flex align-items-center gap-2 text-secondary" style={{ maxWidth: '900px' }}>
                <span className="spinner-border spinner-border-sm" aria-hidden="true" />
                Loading your saved analyses…
              </div>
            </div>
          ) : historyError ? (
            <section className="container py-4" aria-labelledby="history-error-title">
              <div className="alert alert-danger mx-auto" role="alert" style={{ maxWidth: '900px' }}>
                <h2 className="h5" id="history-error-title">Unable to load analysis history</h2>
                <p>{historyError}</p>
                <button
                  className="btn btn-outline-danger"
                  onClick={() => setHistoryRequest((request) => request + 1)}
                  type="button"
                >
                  Try again
                </button>
              </div>
            </section>
          ) : (
            <ResumeAnalysisHistory analyses={analyses} />
          )}
        </main>
      )}
    </>
  )
}

export default ResumeAnalyzerPage