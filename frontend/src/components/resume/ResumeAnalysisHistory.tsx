import type { ResumeAnalysisHistoryItem } from '../../types/resume'

interface ResumeAnalysisHistoryProps {
  analyses: ResumeAnalysisHistoryItem[]
}

function formatDate(value: string) {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return 'Date unavailable'

  return new Intl.DateTimeFormat(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(date)
}

function ResumeAnalysisHistory({ analyses }: ResumeAnalysisHistoryProps) {
  return (
    <section className="container py-4 py-md-5" aria-labelledby="resume-history-title">
      <div className="mx-auto" style={{ maxWidth: '900px' }}>
        <div className="d-flex flex-column flex-sm-row justify-content-between align-items-sm-end gap-2 mb-3">
          <div>
            <p className="text-uppercase small fw-semibold text-success mb-2">Resume analyzer</p>
            <h2 className="h3 mb-0" id="resume-history-title">Analysis history</h2>
          </div>
          <span className="small text-secondary">
            {analyses.length} {analyses.length === 1 ? 'analysis' : 'analyses'}
          </span>
        </div>

        {analyses.length === 0 ? (
          <div className="alert alert-light border mb-0" role="status">
            <h3 className="h5">No saved analyses yet</h3>
            <p className="text-secondary mb-0">
              Completed resume analyses will appear here.
            </p>
          </div>
        ) : (
          <div className="list-group">
            {analyses.map((analysis) => (
              <article className="list-group-item p-3 p-md-4" key={analysis._id}>
                <div className="d-flex flex-column flex-sm-row justify-content-between gap-3">
                  <div>
                    <p className="small text-secondary mb-2">{formatDate(analysis.createdAt)}</p>
                    <p className="mb-0 text-break">
                      {analysis.job
                        ? `Linked job ID: ${analysis.job}`
                        : 'No linked job listing'}
                    </p>
                  </div>
                  <div className="text-sm-end flex-shrink-0">
                    <span className="badge text-bg-success fs-6">
                      {typeof analysis.score === 'number' && Number.isFinite(analysis.score)
                        ? `${analysis.score}%`
                        : 'Score unavailable'}
                    </span>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </div>
    </section>
  )
}

export default ResumeAnalysisHistory