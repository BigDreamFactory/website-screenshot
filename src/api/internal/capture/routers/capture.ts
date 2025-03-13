// Base
import express from 'express'

// Helpers
import { ClientError, handleClientError } from '@helpers/errors/exception'

// Packages
import * as screenshotone from 'screenshotone-api-sdk'
import { instanceOfString } from '@helpers/utils/interfaces'

const soAccessKey = process.env.SCREENSHOTONE_ACCESS_KEY
const soSecretKey = process.env.SCREENSHOTONE_SECRET_KEY

if (!soAccessKey || !soSecretKey) {
  throw new Error('Missing ScreenshotOne keys.')
}

const soClient = new screenshotone.Client(soAccessKey, soSecretKey)

const router = express.Router()

router.get('/capture', async (req, res) => {
  try {
    const {
      type,
      url,
      width = '1920',
      height = '1080',
      fullPage = 'false',
      mobile = 'false'
    } = req.query

    if (!instanceOfString(url)) {
      throw new ClientError('missing_website_url', 'Missing website url')
    }

    let captureBlob

    if (type == 'static') {
      const soOptions = screenshotone.TakeOptions.url(url)
        .format('png')
        .viewportWidth(Number(width))
        .viewportHeight(Number(height))
        .viewportMobile(mobile == 'true')
        .fullPage(fullPage == 'true')
        .blockAds(true)
        .blockCookieBanners(true)
        .blockTrackers(true)
        .cache(true)
        .cacheTtl(14400)

      captureBlob = await soClient.take(soOptions)
    } else if (type == 'scroll') {
      const soOptions = screenshotone.AnimateOptions.url(url)
        .format('mp4')
        .viewportWidth(Number(width))
        .viewportHeight(Number(height))
        .viewportMobile(mobile == 'true')
        .blockAds(true)
        .blockCookieBanners(true)
        .blockTrackers(true)
        .scenario('scroll')
        .scrollStartImmediately(true)
        .duration(30)
        .scrollDelay(500)
        .scrollDuration(1500)
        .scrollBy(Number(height))
        .scrollComplete(true)
        .scrollBack(true)
        .scrollEasing('ease_in_out_quint')
        .cache(true)
        .cacheTtl(14400)

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
