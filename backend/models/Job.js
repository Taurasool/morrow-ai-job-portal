const mongoose = require('mongoose')

const jobSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 120,
    },
    companyName: {
      type: String,
      required: true,
      trim: true,
      maxlength: 120,
    },
    location: {
      type: String,
      required: true,
      trim: true,
      maxlength: 120,
    },
    category: {
      type: String,
      required: true,
      enum: [
        'Engineering',
        'Design',
        'Product',
        'Data & Analytics',
        'Marketing',
        'Sales',
        'Operations',
        'Customer Success',
        'Other',
      ],
    },
    employmentType: {
      type: String,
      enum: ['Full-time', 'Part-time', 'Contract', 'Internship'],
      default: 'Full-time',
    },
    salaryRange: {
      type: String,
      trim: true,
      maxlength: 80,
      default: '',
    },
    description: {
      type: String,
      required: true,
      trim: true,
      maxlength: 12000,
    },
    requirements: {
      type: [String],
      default: [],
    },
    requiredSkills: {
      type: [String],
      default: [],
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    postedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
  },
  { timestamps: true },
)

jobSchema.index({ isActive: 1, createdAt: -1 })

module.exports = mongoose.model('Job', jobSchema)