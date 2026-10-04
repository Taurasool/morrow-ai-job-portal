import SiteHeader from '../components/common/SiteHeader'
import type { AuthUser } from '../types/auth'

interface HomePageProps {
  user: AuthUser | null
  onLogout: () => void
}

const steps = [
  {
    number: '01',
    title: 'Know what matters',
    description:
      'Start with the skills, strengths, and kind of work you want to bring to your next role.',
  },
  {
    number: '02',
    title: 'Find your direction',
    description:
      'Explore opportunities with the context to decide whether they are right for you.',
  },
  {
    number: '03',
    title: 'Move with confidence',
    description:
      'Prepare your story and take a clearer, more considered next step.',
  },
]

function HomePage({ user, onLogout }: HomePageProps) {
  return (
    <>
      <SiteHeader user={user} onLogout={onLogout} />
      <main>
        <section className="hero" id="top" aria-labelledby="hero-title">
          <img
            className="hero-image"
            src="https://images.unsplash.com/photo-1521737711867-e3b97375f902?auto=format&fit=crop&w=2200&q=85"
            alt="Colleagues sharing ideas around a table"
          />
          <div className="hero-shade" aria-hidden="true" />
          <div className="hero-content page-shell">
            <p className="eyebrow hero-eyebrow">A more thoughtful career search</p>
            <h1 id="hero-title">
              Make your next move <span>mean more.</span>
            </h1>
            <p className="hero-copy">
              A clearer way to explore work, understand your strengths, and get
              ready for what comes next.
            </p>
            <a className="hero-link" href="#approach">
              Discover the approach <span aria-hidden="true">↘</span>
            </a>
          </div>
          <p className="hero-index" aria-hidden="true">
            <span>01</span> / A fresh perspective
          </p>
        </section>

        <section className="approach-section" id="approach">
          <div className="page-shell">
            <div className="section-intro">
              <p className="eyebrow">A better way forward</p>
              <h2>Good decisions start with a little more clarity.</h2>
              <p>
                A career move is personal. Morrow is designed to make the
                process feel more focused, from the first search to the next
                conversation.
              </p>
            </div>

            <div className="steps-grid">
              {steps.map((step) => (
                <article className="step-item" key={step.number}>
                  <span className="step-number">{step.number}</span>
                  <h3>{step.title}</h3>
                  <p>{step.description}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="audience-section candidate-section" id="candidates">
          <div className="page-shell audience-layout">
            <div className="audience-heading">
              <p className="eyebrow">For candidates</p>
              <h2>Your next chapter should sound like you.</h2>
            </div>
            <div className="audience-copy">
              <p>
                Bring your experience into focus, find roles that fit your
                direction, and prepare to tell your story with confidence.
              </p>
              <a className="text-link" href="#jobs">
                Explore open roles <span aria-hidden="true">↗</span>
              </a>
            </div>
          </div>
        </section>

        <section className="audience-section employer-section" id="employers">
          <div className="page-shell audience-layout">
            <div className="audience-heading">
              <p className="eyebrow">For employers</p>
              <h2>Meet people for more than a job title.</h2>
            </div>
            <div className="audience-copy">
              <p>
                Make room for the skills and potential behind every
                application, and build a hiring process with people at its
                center.
              </p>
              <a className="text-link" href="#recruiter">
                Open recruiter workspace <span aria-hidden="true">↗</span>
              </a>
            </div>
          </div>
        </section>
      </main>

      <footer className="site-footer">
        <div className="page-shell footer-content">
          <a className="brand footer-brand" href="#top" aria-label="Morrow home">
            <span className="brand-mark" aria-hidden="true">
              m
            </span>
            <span>morrow</span>
          </a>
          <p>Make your next move mean more.</p>
          <a href="#top" className="back-to-top">
            Back to top <span aria-hidden="true">↑</span>
          </a>
        </div>
      </footer>
    </>
  )
}

export default HomePage