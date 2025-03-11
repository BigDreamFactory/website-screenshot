import { SortOrder } from 'mongoose'
import MongoQS from 'mongo-querystring'
import { instanceOfString } from '@helpers/utils/interfaces'

type QueryOptions = string | string[]

interface Sort {
  [key: string]: SortOrder
}

interface Search {
  $or: object[]
}

interface Query {
  _skip?: string
  _limit?: string
  _sort?: string | string[]
  _populate?: string | string[]
  _select?: string | string[]
  _locale?: string | string[]
  _clear?: string
  filters?: object
}

interface FormattedQuery {
  skip: number
  limit: number
  sort: Sort
  populate: string[]
  select: string[]
  clear: boolean
  filters: object
  locale: string | undefined
}

const formatQuery = (query: Query): FormattedQuery => {
  const { _skip, _limit, _sort, _populate, _select, _locale, _clear, ..._filters } = query

  const qs = new MongoQS({
    custom: {
      _or: function (query: Search, input: object | object[]) {
        if (Array.isArray(input)) {
          const or = input.map((or) => qs.parse(or))
          query.$or = or
        } else {
          const or = qs.parse(input)
          query.$or = [or]
        }
      }
    }
  })

  const skip = _skip ? parseInt(_skip) : 0
  const limit = _limit ? parseInt(_limit) : 0
  const sort = _sort ? formatSort(_sort) : ({ createdAt: -1 } as Sort)
  const populate = _populate ? formatStandardParams(_populate) : []
  const select = _select ? formatStandardParams(_select) : []
  const clear = !!_clear
  const filters = qs.parse(_filters)
  const locale = instanceOfString(_locale) ? _locale : undefined

  if (!locale) {
    filters.i18n = { $exists: false }
  } else {
    filters['i18n.locale'] = locale
  }

  return { skip, limit, sort, populate, select, clear, filters, locale }
}

const formatSort = (_sort: QueryOptions) => {
  let sort: Sort = {}

  if (_sort instanceof Array) {
    _sort.forEach((sortElem) => {
      sort = {
        ...sort,
        ...parseSort(sortElem)
      }
    })
  } else {
    sort = parseSort(_sort)
  }

  return sort
}

const formatStandardParams = (_params: QueryOptions) => {
  const params: string[] = []

  if (_params instanceof Array) {
    _params.forEach((param) => {
      params.push(parseParams(param))
    })
  } else {
    params.push(parseParams(_params))
  }

  return params
}

const parseSort = (sort: string) => {
  const parts = sort.split(':')
  return {
    [parts[0]]: parts[1] === 'desc' ? -1 : 1
  } as Sort
}

const parseParams = (params: string) => {
  try {
    return JSON.parse(params)
  } catch {
    return params
  }
}

export { formatQuery as default, Query, FormattedQuery }
