const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')
const mongoose = require('mongoose')
const User = require('../models/User')

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const allowedRoles = ['Candidate', 'Recruiter']

function checkAuthSetup(response) {
  if (!process.env.JWT_SECRET) {
    response.status(503).json({ message: 'Set JWT_SECRET in the backend environment to enable authentication.' })
    return false
  }

  if (mongoose.connection.readyState !== 1) {
    response.status(503).json({ message: 'The database is unavailable. Check the MongoDB connection.' })
    return false
  }

  return true
}

function createToken(user) {
  return jwt.sign(
    {
      name: user.name,
      email: user.email,
      role: user.role,
    },
    process.env.JWT_SECRET,
    { subject: user._id.toString(), expiresIn: '1d' },
  )
}

function userResponse(user) {
  return {
    id: user._id.toString(),
    name: user.name,
    email: user.email,
    role: user.role,
  }
}

async function register(request, response) {
  const { name, email, password, role } = request.body || {}

  if (
    typeof name !== 'string' ||
    name.trim().length < 2 ||
    name.trim().length > 80 ||
    typeof email !== 'string' ||
    !emailPattern.test(email.trim()) ||
    typeof password !== 'string' ||
    password.length < 8 ||
    !allowedRoles.includes(role)
  ) {
    return response.status(400).json({
      message: 'Enter a valid name, email, password of at least 8 characters, and account type.',
    })
  }

  if (!checkAuthSetup(response)) return

  try {
    const normalizedEmail = email.trim().toLowerCase()
    const existingUser = await User.findOne({ email: normalizedEmail })
    if (existingUser) {
      return response.status(409).json({ message: 'An account with this email already exists.' })
    }

    const hashedPassword = await bcrypt.hash(password, 12)
    const user = await User.create({
      name: name.trim(),
      email: normalizedEmail,
      password: hashedPassword,
      role,
    })

    return response.status(201).json({
      token: createToken(user),
      user: userResponse(user),
    })
  } catch (error) {
    if (error.code === 11000) {
      return response.status(409).json({ message: 'An account with this email already exists.' })
    }

    console.error('Registration failed:', error.message)
    return response.status(500).json({ message: 'Unable to create your account right now.' })
  }
}

async function login(request, response) {
  const { email, password } = request.body || {}

  if (
    typeof email !== 'string' ||
    !emailPattern.test(email.trim()) ||
    typeof password !== 'string' ||
    password.length === 0
  ) {
    return response.status(400).json({ message: 'Enter a valid email and password.' })
  }

  if (!checkAuthSetup(response)) return

  try {
    const user = await User.findOne({ email: email.trim().toLowerCase() }).select('+password')
    if (!user || !(await bcrypt.compare(password, user.password))) {
      return response.status(401).json({ message: 'Email or password is incorrect.' })
    }

    return response.json({
      token: createToken(user),
      user: userResponse(user),
    })
  } catch (error) {
    console.error('Login failed:', error.message)
    return response.status(500).json({ message: 'Unable to sign in right now.' })
  }
}

function getCurrentUser(request, response) {
  return response.json({ user: request.user })
}

module.exports = { register, login, getCurrentUser }