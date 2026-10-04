import type {
  AuthResponse,
  AuthUser,
  LoginDetails,
  RegisterDetails,
} from '../types/auth'
import { apiRequest } from './apiClient'

export function registerAccount(details: RegisterDetails) {
  return apiRequest<AuthResponse>('/auth/register', {
    method: 'POST',
    body: JSON.stringify(details),
  })
}

export function loginAccount(details: LoginDetails) {
  return apiRequest<AuthResponse>('/auth/login', {
    method: 'POST',
    body: JSON.stringify(details),
  })
}

export async function getCurrentUser(token: string) {
  const response = await apiRequest<{ user: AuthUser }>('/auth/me', {}, token)
  return response.user
}