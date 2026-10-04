import type { ResumeAnalysis } from '../../types/resume'

interface ResumeAnalysisResultsProps {
  analysis: ResumeAnalysis
}

function ResumeAnalysisResults({ analysis }: ResumeAnalysisResultsProps) {
  const score = typeof analysis.score === 'number' && Number.isFinite(analysis.score)
    ? Math.min(100, Math.max(0, analysis.score))
    : null
  const matchedSkills = Array.isArray(analysis.matchedSkills) ? analysis.matchedSkills : []
  const missingSkills = Array.isArray(analysis.missingSkills) ? analysis.missingSkills : []
  const suggestions = Array.isArray(analysis.suggestions) ? analysis.suggestions : []
  const interviewQuestions = Array.isArray(analysis.interviewQuestions)
    ? analysis.interviewQuestions
    : []

  return (
    <section className="container py-4 py-md-5" aria-labelledby="resume-results-title">
      <div className="mx-auto" style={{ maxWidth: '900px' }}>
        <p className="text-uppercase small fw-semibold text-success mb-2">Resume analyzer</p>
        <h2 className="h3 mb-4" id="resume-results-title">Analysis results</h2>

        <div className="card border-0 shadow-sm mb-4">
          <div className="card-body p-4">
            <div className="d-flex flex-column flex-sm-row justify-content-between align-items-sm-center gap-3">
              <div>
                <h3 className="h5 mb-1">Resume score</h3>
                <p className="text-secondary small mb-0">Based on the selected job context</p>
              </div>
              <p className="h2 text-success mb-0">
                {score === null ? 'Not available' : `${score}%`}
              </p>
            </div>
            {score !== null && (
              <div
                className="progress mt-3"
                role="progressbar"
                aria-label="Resume match score"
                aria-valuenow={score}
                aria-valuemin={0}
                aria-valuemax={100}
              >
                <div className="progress-bar bg-success" style={{ width: `${score}%` }} />
              </div>
            )}
          </div>
        </div>

        <div className="row g-3 mb-3">
          <div className="col-12 col-md-6">
            <section className="card h-100 border-0 shadow-sm" aria-labelledby="matched-skills-title">
              <div className="card-body p-4">
                <h3 className="h5" id="matched-skills-title">Matched skills</h3>
                {matchedSkills.length > 0 ? (
                  <ul className="list-unstyled d-flex flex-wrap gap-2 mb-0">
                    {matchedSkills.map((skill, index) => (
                      <li className="badge text-bg-success fw-normal" key={`${skill}-${index}`}>
                        {skill}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-secondary mb-0">No matched skills were returned.</p>
                )}
              </div>
            </section>
          </div>

          <div className="col-12 col-md-6">
            <section className="card h-100 border-0 shadow-sm" aria-labelledby="missing-skills-title">
              <div className="card-body p-4">
                <h3 className="h5" id="missing-skills-title">Missing skills</h3>
                {missingSkills.length > 0 ? (
                  <ul className="list-unstyled d-flex flex-wrap gap-2 mb-0">
                    {missingSkills.map((skill, index) => (
                      <li className="badge text-bg-light border text-secondary fw-normal" key={`${skill}-${index}`}>
                        {skill}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-secondary mb-0">No missing skills were returned.</p>
                )}
              </div>
            </section>
          </div>
        </div>

        <section className="card border-0 shadow-sm mb-3" aria-labelledby="resume-summary-title">
          <div className="card-body p-4">
            <h3 className="h5" id="resume-summary-title">Professional summary</h3>
            {analysis.summary?.trim()
              ? <p className="mb-0" style={{ whiteSpace: 'pre-line' }}>{analysis.summary}</p>
              : <p className="text-secondary mb-0">No summary was returned.</p>}
          </div>
        </section>

        <div className="row g-3">
          <div className="col-12 col-md-6">
            <section className="card h-100 border-0 shadow-sm" aria-labelledby="suggestions-title">
              <div className="card-body p-4">
                <h3 className="h5" id="suggestions-title">Improvement suggestions</h3>
                {suggestions.length > 0 ? (
                  <ul className="mb-0 ps-3">
                    {suggestions.map((suggestion, index) => <li className="mb-2" key={`${suggestion}-${index}`}>{suggestion}</li>)}
                  </ul>
                ) : (
                  <p className="text-secondary mb-0">No suggestions were returned.</p>
                )}
              </div>
            </section>
          </div>

          <div className="col-12 col-md-6">
            <section className="card h-100 border-0 shadow-sm" aria-labelledby="interview-questions-title">
              <div className="card-body p-4">
                <h3 className="h5" id="interview-questions-title">Interview questions</h3>
                {interviewQuestions.length > 0 ? (
                  <ol className="mb-0 ps-3">
                    {interviewQuestions.map((question, index) => <li className="mb-2" key={`${question}-${index}`}>{question}</li>)}
                  </ol>
                ) : (
                  <p className="text-secondary mb-0">No interview questions were returned.</p>
                )}
              </div>
            </section>
          </div>
        </div>
      </div>
    </section>
  )
}

export default ResumeAnalysisResults