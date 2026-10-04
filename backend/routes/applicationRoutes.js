const express = require('express')
const {
	getMyApplications,
	updateApplicationStatus,
} = require('../controllers/applicationController')
const { authenticateToken, requireRole } = require('../middleware/authMiddleware')

const router = express.Router()

router.get('/me', authenticateToken, requireRole('Candidate'), getMyApplications)
router.patch('/:applicationId/status', authenticateToken, requireRole('Recruiter'), updateApplicationStatus)

module.exports = router