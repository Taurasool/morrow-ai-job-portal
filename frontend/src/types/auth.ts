export type UserRole = 'Candidate' | 'Recruiter'

export interface AuthUser {
  id: string
  name: string
  email: string
  role: UserRole
}

export interface AuthResponse {
  token: string
  user: AuthUser
}

export interface RegisterDetails {
  name: string
  email: string
  password: string
  role: UserRole
}

export interface LoginDetails {
  email: string
  password: string
}