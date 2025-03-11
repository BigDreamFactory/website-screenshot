// Base
import { Request, Response, Router, NextFunction } from 'express'

// Packages
import { FilterQuery, Model, Document } from 'mongoose'
import { MongoServerError } from 'mongodb'
import { json2csv } from 'json-2-csv'
import flatten from 'flat'

// Actions
// import { deleteAsset } from '@api/general/assets/actions/asset'
// import { parseAndUploadAsset } from '../actions/parser'

// Helpers
import formatQuery, { Query } from '@helpers/endpoints/formatQuery'
import { ClientError, handleClientError } from '@helpers/errors/exception'
import { filterKeys, merge } from '@helpers/utils/object'

type Before = (req: Request, res: Response, next: NextFunction) => void
type After = (req: Request, data: unknown) => void

interface Data extends Document {
  i18n?: {
    default: string
    locale: string
  }
  [key: string]: unknown
}

const loadDefaultRouters = <T>({
  router,
  path,
  i18n,
  model,
  lifecycles
}: {
  router: Router
  path: string
  i18n?: string[]
  model: Model<T>
  lifecycles?: {
    beforeCreate?: Before
    beforeUpdate?: Before
    afterCreate?: After
  }
}) => {
  router.post(
    `/${path}`,
    [...setupMiddleware(lifecycles?.beforeCreate)],
    async (req: Request, res: Response) => {
      const data = await create({ req, res, model })
      if (data && lifecycles?.afterCreate) {
        lifecycles.afterCreate(req, data)
      }
    }
  )
  router.get(`/${path}`, async (req, res) => findAll({ req, res, model }))
  router.get(`/${path}/count`, async (req, res) => count({ req, res, model }))
  router.get(`/${path}/export`, async (req, res) => exportData({ req, res, model, path }))
  router.get(`/${path}/:id`, async (req, res) => findByID({ req, res, model }))
  router.put(
    `/${path}/:id`,
    [...setupMiddleware(lifecycles?.beforeUpdate)],
    async (req: Request, res: Response) => updateByID({ req, res, allowedUpdates: [], i18n, model })
  )
  router.delete(`/${path}/:id`, async (req, res) => removeByID({ req, res, i18n, model }))
  if (i18n) {
    router.get(`/${path}/:id/locales`, async (req, res) => getLocales({ req, res, model }))
    router.get(`/${path}/:id/locales/fields`, async (req, res) => {
      const { populate } = formatQuery(req.query)
      await getLocalesFields({ req, res, i18n, populate, model })
    })
  }
}

const loadDefaultSingleRouters = <T>({
  router,
  path,
  i18n,
  model
}: {
  router: Router
  path: string
  i18n?: string[]
  model: Model<T>
}) => {
  router.get(`/${path}`, async (req, res) => findSingle({ req, res, model }))
  router.put(`/${path}`, async (req, res) => updateSingle({ req, res, model }))

  if (i18n) {
    router.get(`/${path}/:id/locales`, async (req, res) => getLocales({ req, res, model }))
    router.get(`/${path}/:id/locales/fields`, async (req, res) => {
      const { populate } = formatQuery(req.query)
      await getLocalesFields({ req, res, i18n, populate, model })
    })
  }
}

// Create data
const create = async <T>({ req, res, model }: { req: Request; res: Response; model: Model<T> }) => {
  try {
    const data = new model(req.body) as unknown as Data

    // const assets = await parseAndUploadAsset({ files: req.files, auth: req.auth })

    // for (let i = 0; i < assets.length; i++) {
    //   const { asset, filePath } = assets[i]
    //   data[filePath] = asset._id
    // }

    // try {
    await data.save()
    res.status(201).send(data)
    return data
    // } catch (error) {
    //   for (let i = 0; i < assets.length; i++) {
    //     const { asset } = assets[i]
    //     await deleteAsset({ _id: asset._id })
    //   }

    //   throw error
    // }
  } catch (error) {
    const { details, status } = handleClientError(parseError(error))
    res.status(status).send(details)
  }
}

// Get data
// GET /[]?email=tadas@gmail.com -> https://github.com/Turistforeningen/node-mongo-querystring
// GET /[]?_limit=10&_skip=20
// GET /[]?sort=created:asc
// GET /[]?sort=created:desc
const findAll = async <T>({
  req,
  res,
  model
}: {
  req: Request
  res: Response
  model: Model<T>
}) => {
  try {
    const data = await findData({ req, model })

    res.send(data)
  } catch (error) {
    const { details, status } = handleClientError(parseError(error))
    res.status(status).send(details)
  }
}

// Get data by ID
const findByID = async <T>({
  req,
  res,
  model
}: {
  req: Request
  res: Response
  model: Model<T>
}) => {
  try {
    const { populate, select, clear } = formatQuery(req.query)

    const _id = req.params.id

    const data = await model.findById(_id).populate(populate).select(select)
    if (!data) {
      throw new ClientError('no_matches', 'No matches found', 404)
    }

    const sanitizedData = sanitizeData(data, { clear })

    res.send(sanitizedData)
  } catch (error) {
    const { details, status } = handleClientError(parseError(error))
    res.status(status).send(details)
  }
}

// Get data by custom key
const findBy = async <T>({ req, res, model }: { req: Request; res: Response; model: Model<T> }) => {
  try {
    const { populate, select, clear } = formatQuery(req.query)

    const key = req.params.key
    const value = req.params.value

    const filterQuery = { [key]: value } as FilterQuery<T>

    const data = await model.findOne(filterQuery).populate(populate).select(select)

    if (!data) {
      throw new ClientError('no_matches', 'No matches found', 404)
    }

    const sanitizedData = sanitizeData(data, { clear })

    res.send(sanitizedData)
  } catch (error) {
    const { details, status } = handleClientError(parseError(error))
    res.status(status).send(details)
  }
}

const findSingle = async <T>({
  req,
  res,
  model
}: {
  req: Request
  res: Response
  model: Model<T>
}) => {
  try {
    const { populate, select, clear, locale } = formatQuery(req.query)

    let entry = (await model
      .findOne({ 'i18n.locale': locale })
      .populate(populate)
      .select(select)) as unknown as Data

    if (!entry) {
      entry = new model() as unknown as Data

      if (locale) {
        const defaultEntry = await model.findOne()

        if (!defaultEntry) {
          throw new ClientError('missing_default_locale', 'Missing default locale entry', 404)
        }

        entry.i18n = {
          default: defaultEntry._id,
          locale
        }
      }

      await entry.save()
    }

    const sanitizedEntry = sanitizeData(entry, { clear })

    res.send(sanitizedEntry)
  } catch (error) {
    const { details, status } = handleClientError(parseError(error))
    res.status(status).send(details)
  }
}

// Count all occurances
const count = async <T>({ req, res, model }: { req: Request; res: Response; model: Model<T> }) => {
  try {
    const { skip, limit, filters } = formatQuery(req.query as unknown as Query)

    const count = await model.count(filters).skip(skip).limit(limit)
    res.send({ count })
  } catch (error) {
    const { details, status } = handleClientError(parseError(error))
    res.status(status).send(details)
  }
}

// Get all records with different locales
const getLocales = async <T>({
  req,
  res,
  model
}: {
  req: Request
  res: Response
  model: Model<T>
}) => {
  try {
    const _id = req.params.id

    let defaultId = ''

    const currentEntry = (await model.findById(_id)) as Data

    if (!currentEntry) {
      throw new ClientError('no_matches', 'No matches found', 404)
    }

    if (!currentEntry.i18n) {
      defaultId = currentEntry._id
    } else {
      defaultId = currentEntry.i18n.default
    }

    const data = await model
      .find({ $or: [{ _id: defaultId }, { 'i18n.default': defaultId }] })
      .select(['i18n.locale'])

    res.send(data)
  } catch (error) {
    const { details, status } = handleClientError(parseError(error))
    res.status(status).send(details)
  }
}

// Get default locales entry fields
const getLocalesFields = async <T>({
  req,
  res,
  i18n,
  populate,
  model
}: {
  req: Request
  res: Response
  i18n: string[]
  populate: string[]
  model: Model<T>
}) => {
  try {
    const _id = req.params.id

    let defaultId = ''

    const currentEntry = (await model.findById(_id)) as Data

    if (!currentEntry) {
      throw new ClientError('no_matches', 'No matches found', 404)
    }

    if (!currentEntry.i18n) {
      defaultId = currentEntry._id
    } else {
      defaultId = currentEntry.i18n.default
    }

    const data = await model
      .findById(defaultId)
      .select(i18n.map((key) => `-${key}`))
      .populate(populate)

    if (!data) {
      throw new ClientError('no_matches', 'No matches found', 404)
    }

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { createdAt, updatedAt, ...sanitizedData } = sanitizeData(data, {
      clear: true
    })

    res.send(sanitizedData)
  } catch (error) {
    const { details, status } = handleClientError(parseError(error))
    res.status(status).send(details)
  }
}

// Update data
const updateByID = async <T>({
  req,
  res,
  allowedUpdates,
  i18n,
  model
}: {
  req: Request
  res: Response
  allowedUpdates: string[]
  i18n?: string[]
  model: Model<T>
}) => {
  try {
    const _id = req.params.id

    const body = req.body
    const updates = Object.keys(body)

    if (allowedUpdates.length > 0) {
      const isValidOperation = updates.every((update) => {
        return allowedUpdates.includes(update)
      })

      if (!isValidOperation) {
        throw new ClientError('invalid_update_body', 'Invalid update body')
      }
    }

    const data = (await model.findByIdAndUpdate(_id, body, {
      new: true,
      runValidators: true
    })) as Data

    if (!data) {
      throw new ClientError('no_matches', 'No matches found', 404)
    }

    // const assets = await parseAndUploadAsset({ files: req.files, auth: req.auth })

    // if (assets.length > 0) {
    //   for (let i = 0; i < assets.length; i++) {
    //     const { asset, filePath } = assets[i]

    //     if (data[filePath]) {
    //       deleteAsset({ _id: data[filePath] as string })
    //     }

    //     data[filePath] = asset._id
    //   }

    //   await data.save()
    // }

    if (i18n) {
      const localeUpdates = filterKeys({ target: body, keys: i18n })

      const localeEntries = await model.find({ 'i18n.default': _id })

      for (let i = 0; i < localeEntries.length; i++) {
        const localeEntry = localeEntries[i]

        await model.findByIdAndUpdate(localeEntry._id, merge(localeEntry.toObject(), localeUpdates))
      }
    }

    res.send(data)
    return data
  } catch (error) {
    const { details, status } = handleClientError(parseError(error))
    res.status(status).send(details)
  }
}

// Update data
const updateSingle = async <T>({
  req,
  res,
  model
}: {
  req: Request
  res: Response
  model: Model<T>
}) => {
  try {
    const { locale } = formatQuery(req.query)

    const body = req.body

    const data = await model.findOneAndUpdate({ 'i18n.locale': locale }, body, {
      new: true,
      runValidators: true
    })

    if (!data) {
      throw new ClientError('no_matches', 'No matches found', 404)
    }

    res.send(data)
  } catch (error) {
    const { details, status } = handleClientError(parseError(error))
    res.status(status).send(details)
  }
}

// Remove data
const removeByID = async <T>({
  req,
  res,
  i18n,
  model
}: {
  req: Request
  res: Response
  i18n?: string[]
  model: Model<T>
}) => {
  try {
    const _id = req.params.id

    const data = (await model.findByIdAndDelete(_id)) as Data

    if (!data) {
      throw new ClientError('no_matches', 'No matches found', 404)
    }

    if (i18n && !data.i18n) {
      await model.deleteMany({ 'i18n.default': _id })
    }

    res.send(data)
  } catch (error) {
    const { details, status } = handleClientError(parseError(error))
    res.status(status).send(details)
  }
}

// Export data
const exportData = async <T>({
  req,
  res,
  model,
  path
}: {
  req: Request
  res: Response
  model: Model<T>
  path: string
}) => {
  try {
    req.query.clear = 'true'

    const now = new Date()

    const data = await findData({ req, model })

    const flattenedData = data.map((item) => flatten(item, { delimiter: '․' }) as object)

    const csv = await json2csv(flattenedData, { emptyFieldValue: '', useDateIso8601Format: true })

    const filename = `${path}-${now.toISOString()}.csv`

    res.send({
      filename,
      file: csv
    })
  } catch (error) {
    const { details, status } = handleClientError(parseError(error))
    res.status(status).send(details)
  }
}

const findData = async <T>({ req, model }: { req: Request; model: Model<T> }) => {
  const { skip, limit, sort, populate, select, filters, clear } = formatQuery(req.query)

  const data = await model
    .find(filters, null)
    .skip(skip)
    .limit(limit)
    .sort(sort)
    .populate(populate)
    .select(select)

  return data.map((dataItem) => sanitizeData(dataItem, { clear }))
}

const parseError = (error: unknown) => {
  if (error instanceof Error) {
    if (error.name == 'ValidationError') {
      return new ClientError(`mongodb_validation`, error.message, 400)
    } else if (error.name == 'CastError') {
      return new ClientError(`mongodb_cast`, error.message, 400)
    }
  }

  if (error instanceof MongoServerError) {
    return new ClientError(`mongodb_server_${error.code}`, error.message, 400, error.keyValue)
  }

  return error
}

const sanitizeData = <T extends { toObject: () => { [key: string]: unknown } }>(
  data: T,
  options: { clear: boolean }
) => {
  if (options.clear) {
    return clearData(data.toObject())
  } else {
    return data.toObject()
  }
}

const clearData = <T>(data: T) => {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { _id, __v, ...clearedData } = data as unknown as Data
  return clearedData
}

const setupMiddleware = (before?: Before) => {
  if (!before) {
    return []
  } else {
    return [before]
  }
}

export {
  loadDefaultRouters,
  loadDefaultSingleRouters,
  create,
  findAll,
  findByID,
  findSingle,
  count,
  updateByID,
  updateSingle,
  removeByID,
  exportData,
  parseError,
  findBy,
  sanitizeData
}
