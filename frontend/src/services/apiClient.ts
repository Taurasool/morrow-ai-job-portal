const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api'

interface ApiErrorResponse {
  message?: string
}

export async function apiRequest<T>(
  path: string,
  options: RequestInit = {},
  token?: string,
): Promise<T> {
  const headers = new Headers(options.headers)
  const isFormData = typeof FormData !== 'undefined' && options.body instanceof FormData

  if (isFormData) {
    headers.delete('Content-Type')
  } else if (!headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json')
  }
  if (token) {
    headers.set('Authorization', `Bearer ${token}`)
  }

  let response: Response
  try {
    response = await fetch(`${API_URL}${path}`, { ...options, headers })
  } catch {
    throw new Error('Could not reach the server. Check that the API is running.')
  }

  const body = (await response.json().catch(() => ({}))) as ApiErrorResponse & T
  if (!response.ok) {
    throw new Error(body.message || 'Something went wrong. Please try again.')
  }

  return body
}