// Base
import express from 'express'

// Helpers
import { ClientError, handleClientError } from '@helpers/errors/exception'

// Packages
import * as screenshotone from 'screenshotone-api-sdk'

const soAccessKey = process.env.SCREENSHOTONE_ACCESS_KEY
const soSecretKey = process.env.SCREENSHOTONE_SECRET_KEY

if (!soAccessKey || !soSecretKey) {
  throw new Error('Missing ScreenshotOne keys.')
}

const soClient = new screenshotone.Client(soAccessKey, soSecretKey)

const router = express.Router()

router.post('/capture', async (req, res) => {
  try {
    const { type, url, options } = req.body

    let captureBlob

    if (type == 'static') {
      const soOptions = screenshotone.TakeOptions.url(url)
        .format('webp')
        .viewportWidth(options.width)
        .viewportHeight(options.height)
        .fullPage(options.fullPage)
        .viewportMobile(options.mobile)
        .blockAds(true)
        .blockCookieBanners(true)
        .blockTrackers(true)

      captureBlob = await soClient.take(soOptions)
    } else if (type == 'scroll') {
      const soOptions = screenshotone.AnimateOptions.url('https://www.canva.com')
        .format('mp4')
        .viewportWidth(options.width)
        .viewportHeight(options.height)
        .viewportMobile(options.mobile)
        .blockAds(true)
        .blockCookieBanners(true)
        .blockTrackers(true)
        .scenario('scroll')
        .scrollStartImmediately(true)
        .duration(5)
        .scrollDelay(500)
        .scrollDuration(1500)
        .scrollBy(options.height)
        .scrollComplete(true)
        .scrollBack(true)
        .scrollEasing('ease_in_out_quint')

      captureBlob = await soClient.animate(soOptions)
    } else {
      throw new ClientError('incorrect_type', 'Incorrect screenshot type')
    }

    const captureBuffer = Buffer.from(await captureBlob.arrayBuffer())

    res.setHeader('Content-Type', captureBlob.type)
    res.setHeader('Content-Length', captureBlob.size)

    res.send(captureBuffer)
  } catch (error) {
    const { details, status } = handleClientError(error)
    res.status(status).send(details)
  }
})

export default router
