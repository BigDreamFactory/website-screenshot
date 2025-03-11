import mongoose from 'mongoose'

const mongodbURL = process.env.MONGODB_URL || ''

mongoose.connect(mongodbURL)
