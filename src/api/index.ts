import express from 'express'

const router = express.Router()

router.get('/', async (_req, res) => {
  res.send({
    project: 'Website Screenshot',
    version: process.env.npm_package_version,
    date: new Date()
  })
})

router.get('/robots.txt', function (_req, res) {
  res.type('text/plain')
  res.send('User-agent: *\nDisallow: /')
})

router.get('/sitemap.xml', function (_req, res) {
  res.sendStatus(405)
})

router.get('/favicon.ico', function (_req, res) {
  res.sendStatus(405)
})

export default router
