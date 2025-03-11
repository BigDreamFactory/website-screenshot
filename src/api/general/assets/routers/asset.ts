// Base
import express, { Request, Response } from 'express'

// Models
import Asset from '../models/asset'

// Actions
import { deleteAsset, uploadAsset } from '../actions/asset'

// Vendors
import { getFile } from 'vendors/aws/s3'

//Helpers
import { count, findAll, updateByID } from '@helpers/endpoints/routes/default'
import { ClientError, handleClientError } from '@helpers/errors/exception'

const router = express.Router()

router.get('/assets', async (req, res) => findAll({ req, res, model: Asset }))

router.get('/assets/count', async (req, res) => count({ req, res, model: Asset }))

router.get('/assets/*', async (req, res) => {
  try {
    const response = await getFile(req.path)

    res.writeHead(200, {
      'Content-Type': response.ContentType,
      'Content-Length': response.ContentLength
    })

    res.end(response.Body)
  } catch (error) {
    const { details, status } = handleClientError(error)
    res.status(status).send(details)
  }
})

router.post('/assets', async (req: Request, res: Response) => {
  try {
    if (!req.files || Array.isArray(req.files.file)) {
      throw new ClientError('missing_file', 'No file added')
    }

    const asset = await uploadAsset({
      rawFile: req.files.file,
      data: req.body,
      auth: req.auth,
      model: Asset
    })

    res.send(asset)
  } catch (error) {
    const { details, status } = handleClientError(error)
    res.status(status).send(details)
  }
})

router.put('/assets/:id', async (req, res) =>
  updateByID({ req, res, allowedUpdates: ['alt', 'tags'], model: Asset })
)

router.delete('/assets/:id', async (req, res) => {
  const _id = req.params.id

  try {
    await deleteAsset({ _id })

    res.send()
  } catch (error) {
    const { details, status } = handleClientError(error)
    res.status(status).send(details)
  }
})

export default router
