const mongoose = require('mongoose')

const applicationSchema = new mongoose.Schema(
  {
    candidate: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    job: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Job',
      required: true,
    },
    status: {
      type: String,
      enum: ['Applied', 'Under review', 'Interview', 'Rejected'],
      default: 'Applied',
    },
  },
  { timestamps: true },
)

applicationSchema.index({ candidate: 1, job: 1 }, { unique: true })

module.exports = mongoose.model('Application', applicationSchema)