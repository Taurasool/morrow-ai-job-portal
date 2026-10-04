const mongoose = require('mongoose')

const resumeAnalysisSchema = new mongoose.Schema(
  {
    candidate: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    job: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Job',
      default: null,
    },
    score: {
      type: Number,
      default: null,
      min: 0,
      max: 100,
    },
    matchedSkills: {
      type: [String],
      default: [],
    },
    missingSkills: {
      type: [String],
      default: [],
    },
    summary: {
      type: String,
      required: true,
      trim: true,
      maxlength: 3000,
    },
    suggestions: {
      type: [String],
      default: [],
    },
    interviewQuestions: {
      type: [String],
      default: [],
    },
  },
  { timestamps: true },
)

resumeAnalysisSchema.index({ candidate: 1, createdAt: -1 })

module.exports = mongoose.model('ResumeAnalysis', resumeAnalysisSchema)