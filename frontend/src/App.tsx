import { useEffect, useState } from 'react'
import { AuthProvider, useAuth } from './context/AuthContext'
import AuthPage from './pages/AuthPage'
import HomePage from './pages/HomePage'
import JobBoardPage from './pages/JobBoardPage'
import RecruiterDashboardPage from './pages/RecruiterDashboardPage'
import ResumeAnalyzerPage from './pages/ResumeAnalyzerPage'

function Application() {
  const { user, isInitializing, logout } = useAuth()
  const [hash, setHash] = useState(() => window.location.hash)

  useEffect(() => {
    function updateHash() {
      setHash(window.location.hash)
    }

    window.addEventListener('hashchange', updateHash)
    return () => window.removeEventListener('hashchange', updateHash)
  }, [])

  useEffect(() => {
    if (hash === '#resume' && !isInitializing && !user) {
      window.sessionStorage.setItem('postAuthHash', '#resume')
      window.location.hash = '#login'
    }
  }, [hash, isInitializing, user])

  if (isInitializing) {
    return <main className="auth-loading">Restoring your session…</main>
  }

  if (hash === '#jobs' || hash === '#applications') {
    return <JobBoardPage user={user} onLogout={logout} />
  }

  if (hash === '#recruiter') {
    return <RecruiterDashboardPage user={user} onLogout={logout} />
  }

  if (hash === '#resume') {
    return user
      ? <ResumeAnalyzerPage user={user} onLogout={logout} />
      : <AuthPage mode="login" />
  }

  if (user) {
    return <HomePage user={user} onLogout={logout} />
  }

  if (hash === '#login' || hash === '#register') {
    return <AuthPage mode={hash === '#register' ? 'register' : 'login'} />
  }

  return <HomePage user={null} onLogout={logout} />
}

function App() {
  return (
    <AuthProvider>
      <Application />
    </AuthProvider>
  )
}

export default App