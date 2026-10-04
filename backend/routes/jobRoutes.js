const express = require('express')
const {
	applyForJob,
	getApplicantsForJob,
} = require('../controllers/applicationController')
const {
	createJob,
	deleteJob,
	getJobById,
	getJobs,
	getRecruiterJobs,
	updateJob,
} = require('../controllers/jobController')
const { authenticateToken, requireRole } = require('../middleware/authMiddleware')

const router = express.Router()

router.get('/', getJobs)
router.get('/mine', authenticateToken, requireRole('Recruiter'), getRecruiterJobs)
router.post('/', authenticateToken, requireRole('Recruiter'), createJob)
router.get('/:jobId/applicants', authenticateToken, requireRole('Recruiter'), getApplicantsForJob)
router.put('/:jobId', authenticateToken, requireRole('Recruiter'), updateJob)
router.delete('/:jobId', authenticateToken, requireRole('Recruiter'), deleteJob)
router.get('/:jobId', getJobById)
router.post('/:jobId/apply', authenticateToken, requireRole('Candidate'), applyForJob)

module.exports = router