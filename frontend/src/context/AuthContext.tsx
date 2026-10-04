import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from 'react'
import {
  getCurrentUser,
  loginAccount,
  registerAccount,
} from '../services/authService'
import type { AuthUser, LoginDetails, RegisterDetails } from '../types/auth'

interface AuthContextValue {
  user: AuthUser | null
  isInitializing: boolean
  login: (details: LoginDetails) => Promise<void>
  register: (details: RegisterDetails) => Promise<void>
  logout: () => void
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [isInitializing, setIsInitializing] = useState(true)

  useEffect(() => {
    let isActive = true
    const token = window.localStorage.getItem('authToken')

    if (!token) {
      setIsInitializing(false)
      return () => {
        isActive = false
      }
    }

    getCurrentUser(token)
      .then((currentUser) => {
        if (isActive) setUser(currentUser)
      })
      .catch(() => {
        window.localStorage.removeItem('authToken')
      })
      .finally(() => {
        if (isActive) setIsInitializing(false)
      })

    return () => {
      isActive = false
    }
  }, [])

  async function login(details: LoginDetails) {
    const response = await loginAccount(details)
    window.localStorage.setItem('authToken', response.token)
    setUser(response.user)
  }

  async function register(details: RegisterDetails) {
    const response = await registerAccount(details)
    window.localStorage.setItem('authToken', response.token)
    setUser(response.user)
  }

  function logout() {
    window.localStorage.removeItem('authToken')
    setUser(null)
  }

  return (
    <AuthContext.Provider value={{ user, isInitializing, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used inside AuthProvider.')
  }
  return context
}