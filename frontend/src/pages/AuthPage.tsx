import { useState, type FormEvent } from 'react'
import { useAuth } from '../context/AuthContext'
import type { UserRole } from '../types/auth'

interface AuthPageProps {
  mode: 'login' | 'register'
}

function AuthPage({ mode }: AuthPageProps) {
  const { login, register } = useAuth()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [role, setRole] = useState<UserRole>(() =>
    window.sessionStorage.getItem('preferredAuthRole') === 'Recruiter'
      ? 'Recruiter'
      : 'Candidate',
  )
  const [showPassword, setShowPassword] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')
  const isRegistering = mode === 'register'

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError('')
    setIsSubmitting(true)

    try {
      if (isRegistering) {
        await register({ name, email, password, role })
      } else {
        await login({ email, password })
      }
      const returnHash = window.sessionStorage.getItem('postAuthHash')
      window.sessionStorage.removeItem('postAuthHash')
      window.sessionStorage.removeItem('preferredAuthRole')
      window.location.hash = returnHash || ''
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : 'Unable to complete your request. Please try again.',
      )
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <main className="auth-page">
      <section className="auth-form-side">
        <div className="auth-topline">
          <a className="brand" href="/" aria-label="Morrow home">
            <span className="brand-mark" aria-hidden="true">m</span>
            <span>morrow</span>
          </a>
          <p>
            {isRegistering ? 'Already have an account?' : 'New to Morrow?'}{' '}
            <a href={isRegistering ? '#login' : '#register'}>
              {isRegistering ? 'Sign in' : 'Create account'}
            </a>
          </p>
        </div>

        <div className="auth-form-wrap">
          <p className="eyebrow">{isRegistering ? 'A good place to begin' : 'Welcome back'}</p>
          <h1>{isRegistering ? 'Make room for what’s next.' : 'Pick up where you left off.'}</h1>
          <p className="auth-intro">
            {isRegistering
              ? 'Create an account to start shaping your next career move.'
              : 'Sign in to continue your career search.'}
          </p>

          <form className="auth-form" onSubmit={handleSubmit}>
            {isRegistering && (
              <>
                <fieldset className="role-fieldset">
                  <legend>I’m here as</legend>
                  <div className="role-options">
                    {(['Candidate', 'Recruiter'] as const).map((accountRole) => (
                      <button
                        className={`role-option${role === accountRole ? ' is-selected' : ''}`}
                        type="button"
                        aria-pressed={role === accountRole}
                        key={accountRole}
                        onClick={() => setRole(accountRole)}
                      >
                        <span className="role-option-mark" aria-hidden="true">
                          {role === accountRole ? '●' : '○'}
                        </span>
                        {accountRole}
                      </button>
                    ))}
                  </div>
                </fieldset>
                <label className="auth-field">
                  <span>Full name</span>
                  <input
                    autoComplete="name"
                    maxLength={80}
                    minLength={2}
                    name="name"
                    onChange={(event) => setName(event.target.value)}
                    placeholder="Your name"
                    required
                    value={name}
                  />
                </label>
              </>
            )}

            <label className="auth-field">
              <span>Email address</span>
              <input
                autoComplete="email"
                name="email"
                onChange={(event) => setEmail(event.target.value)}
                placeholder="you@example.com"
                required
                type="email"
                value={email}
              />
            </label>

            <div className="auth-field">
              <label htmlFor="auth-password">Password</label>
              <span className="password-control">
                <input
                  autoComplete={isRegistering ? 'new-password' : 'current-password'}
                  id="auth-password"
                  minLength={isRegistering ? 8 : undefined}
                  name="password"
                  onChange={(event) => setPassword(event.target.value)}
                  placeholder={isRegistering ? 'At least 8 characters' : 'Your password'}
                  required
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                />
                <button
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  onClick={() => setShowPassword((visible) => !visible)}
                  type="button"
                >
                  {showPassword ? 'Hide' : 'Show'}
                </button>
              </span>
            </div>

            {error && (
              <p className="auth-error" role="alert">
                <span aria-hidden="true">!</span> {error}
              </p>
            )}

            <button className="auth-submit" disabled={isSubmitting} type="submit">
              {isSubmitting ? (
                <>
                  <span className="spinner-border spinner-border-sm" aria-hidden="true" />
                  {isRegistering ? 'Creating account…' : 'Signing in…'}
                </>
              ) : (
                <>
                  {isRegistering ? 'Create account' : 'Sign in'}
                  <span aria-hidden="true">↗</span>
                </>
              )}
            </button>
          </form>

          <p className="auth-security-note">
            Your password is hashed before it is stored. Never share your account credentials.
          </p>
        </div>
      </section>

      <aside className="auth-story-panel">
        <div className="auth-story-image" aria-hidden="true" />
        <div className="auth-story-shade" aria-hidden="true" />
        <div className="auth-story-copy">
          <span className="story-mark" aria-hidden="true">“</span>
          <p>A career move is more than a new title. Start with the work you want to do.</p>
          <span className="story-caption">YOUR NEXT CHAPTER, ON YOUR TERMS</span>
        </div>
        <a className="auth-back-link" href="/">
          <span aria-hidden="true">←</span> Back to Morrow
        </a>
      </aside>
    </main>
  )
}

export default AuthPage