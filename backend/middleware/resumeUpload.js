const multer = require('multer')

const MAX_RESUME_SIZE = 5 * 1024 * 1024
const PDF_SIGNATURE = Buffer.from('%PDF-')

const receiveResume = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: MAX_RESUME_SIZE,
    files: 1,
  },
  fileFilter(_request, file, callback) {
    if (file.mimetype.toLowerCase() !== 'application/pdf') {
      const error = new Error('Resume must be uploaded as a PDF file.')
      error.statusCode = 400
      return callback(error)
    }

    return callback(null, true)
  },
}).single('resume')

function hasPdfSignature(buffer) {
  return Buffer.isBuffer(buffer) && buffer.length >= PDF_SIGNATURE.length &&
    buffer.subarray(0, PDF_SIGNATURE.length).equals(PDF_SIGNATURE)
}

function uploadResume(request, response, next) {
  receiveResume(request, response, (error) => {
    if (error) {
      if (error instanceof multer.MulterError) {
        if (error.code === 'LIMIT_FILE_SIZE') {
          return response.status(413).json({ message: 'Resume PDF must be 5 MB or smaller.' })
        }

        if (error.code === 'LIMIT_UNEXPECTED_FILE' || error.code === 'LIMIT_FILE_COUNT') {
          return response.status(400).json({ message: 'Upload exactly one PDF in the "resume" field.' })
        }

        return response.status(400).json({ message: 'The resume upload is invalid.' })
      }

      return response.status(error.statusCode || 400).json({
        message: error.message || 'The resume upload is invalid.',
      })
    }

    if (!request.file) {
      return response.status(400).json({ message: 'Upload one PDF in the "resume" field.' })
    }

    if (!hasPdfSignature(request.file.buffer)) {
      return response.status(400).json({ message: 'The uploaded file does not have a valid PDF signature.' })
    }

    return next()
  })
}

module.exports = { uploadResume, MAX_RESUME_SIZE }