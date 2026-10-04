const mongoose = require('mongoose')

async function connectDatabase() {
  if (!process.env.MONGODB_URI) {
    console.warn('MONGODB_URI is not set; starting without a database connection.')
    return
  }

  await mongoose.connect(process.env.MONGODB_URI)
  console.log('Connected to MongoDB.')
}

module.exports = connectDatabase