import { Express } from 'express'
import listEndpoints from 'express-list-endpoints'

import manualAuth from '@public/endpoints/manual-auth.json'

// Handlers
import { ClientError, handleClientError } from '@helpers/errors/exception'
import { parseError } from './default'

const listPaths = (app: Express) => {
  app.get('/list-paths', (_req, res) => {
    try {
      const endpoints = getEndpoints(app)

      res.send(
        endpoints.map((endpoint) => ({
          key: endpoint.path
        }))
      )
    } catch (error) {
      const { details, status } = handleClientError(parseError(error))
      res.status(status).send(details)
    }
  })

  app.get('/list-methods', (req, res) => {
    try {
      const path = req.query.path

      if (!path) {
        throw new ClientError('missing_path', 'Missing endpoint path', 404)
      }

      const endpoints = getEndpoints(app)

      const endpoint = endpoints.find((endpoint) => endpoint.path == path)

      if (!endpoint) {
        throw new ClientError('no_matches', 'No matches found', 404)
      }

      res.send(
        endpoint.methods.map((method) => ({
          key: method
        }))
      )
    } catch (error) {
      const { details, status } = handleClientError(parseError(error))
      res.status(status).send(details)
    }
  })
}

const getEndpoints = (app: Express) => {
  let endpoints = listEndpoints(app)

  endpoints = endpoints.map((endpoint) => {
    const access = manualAuth.find(({ path }) => path == endpoint.path)

    if (!access || access.roleAccess) {
      return endpoint
    }

    const methods = endpoint.methods.filter((method) => !access.methods.includes(method))

    return {
      ...endpoint,
      methods
    }
  })

  return endpoints.filter((endpoint) => endpoint.path != '*' && endpoint.methods.length != 0)
}

export default listPaths
