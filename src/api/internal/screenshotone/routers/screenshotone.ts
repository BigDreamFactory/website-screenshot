import express from 'express'

import { fetcher } from '@helpers/api/httpMethods'

const router = express.Router()

router.get('/capture', async (_req, res) => {
  const imgRes = await fetcher({
    url: 'https://www.google.com/images/branding/googlelogo/1x/googlelogo_color_272x92dp.png',
    responseType: 'arraybuffer'
  })

  res.setHeader('Content-Type', 'image/png')
  res.setHeader('Content-Length', 5969)

  res.send(imgRes)
})

export default router
