import { useState } from 'react'
import type { AuthUser } from '../../types/auth'

interface SiteHeaderProps {
  user: AuthUser | null
  onLogout: () => void
}

function SiteHeader({ user, onLogout }: SiteHeaderProps) {
  const [menuOpen, setMenuOpen] = useState(false)

  function closeMenu() {
    setMenuOpen(false)
  }

  return (
    <header className="site-header">
      <nav className="site-nav page-shell" aria-label="Main navigation">
        <a className="brand" href="#top" onClick={closeMenu} aria-label="Morrow home">
          <span className="brand-mark" aria-hidden="true">
            m
          </span>
          <span>morrow</span>
        </a>

        <button
          className={`menu-toggle${menuOpen ? ' is-open' : ''}`}
          type="button"
          aria-label={menuOpen ? 'Close navigation menu' : 'Open navigation menu'}
          aria-expanded={menuOpen}
          aria-controls="primary-navigation"
          onClick={() => setMenuOpen((isOpen) => !isOpen)}
        >
          <span />
          <span />
        </button>

        <div
          className={`nav-content${menuOpen ? ' is-open' : ''}`}
          id="primary-navigation"
        >
          <div className="nav-links">
            <a href="#approach" onClick={closeMenu}>
              Our approach
            </a>
            <a href="#jobs" onClick={closeMenu}>
              Find jobs
            </a>
            {user?.role !== 'Recruiter' && (
              <a href="#resume" onClick={closeMenu}>
                Resume Analyzer
              </a>
            )}
            <a href="#candidates" onClick={closeMenu}>
              For candidates
            </a>
            {user?.role === 'Recruiter' ? (
              <a href="#recruiter" onClick={closeMenu}>
                Manage roles
              </a>
            ) : (
              <a href="#employers" onClick={closeMenu}>
                For employers
              </a>
            )}
          </div>
          <div className="nav-actions">
            {user ? (
              <>
                <span className="nav-greeting">Hi, {user.name}</span>
                <button className="nav-logout" onClick={onLogout} type="button">
                  Sign out
                </button>
              </>
            ) : (
              <>
                <a className="nav-sign-in" href="#login" onClick={closeMenu}>
                  Sign in
                </a>
                <a className="nav-cta" href="#register" onClick={closeMenu}>
                  Get started <span aria-hidden="true">↗</span>
                </a>
              </>
            )}
          </div>
        </div>
      </nav>
    </header>
  )
}

export default SiteHeader