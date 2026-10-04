const jwt = require('jsonwebtoken')

function authenticateToken(request, response, next) {
  const authorization = request.headers.authorization
  const token = authorization?.startsWith('Bearer ')
    ? authorization.slice(7)
    : null

  if (!token) {
    return response.status(401).json({ message: 'Authentication is required.' })
  }

  if (!process.env.JWT_SECRET) {
    return response.status(503).json({ message: 'Authentication is not configured.' })
  }

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET)
    request.user = {
      id: payload.sub,
      name: payload.name,
      email: payload.email,
      role: payload.role,
    }
    return next()
  } catch {
    return response.status(401).json({ message: 'Your session is invalid or expired.' })
  }
}

function requireRole(...allowedRoles) {
  return (request, response, next) => {
    if (!request.user || !allowedRoles.includes(request.user.role)) {
      return response.status(403).json({ message: 'You do not have permission to do that.' })
    }

    return next()
  }
}

module.exports = { authenticateToken, requireRole }