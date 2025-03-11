import express from 'express'

const router = express.Router()

router.get('/', async (_req, res) => {
  res.send({
    project: 'Website Screenshot',
    version: process.env.npm_package_version,
    date: new Date()
  })
})

export default router
