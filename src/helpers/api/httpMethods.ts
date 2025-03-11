import axios, { RawAxiosRequestHeaders, ResponseType } from 'axios'

interface Read {
  url: string
  params?: object
  headers?: RawAxiosRequestHeaders
  responseType?: ResponseType
}

interface Write {
  url: string
  params?: object
  body?: object
  headers?: RawAxiosRequestHeaders
}

interface Remove {
  url: string
  headers?: RawAxiosRequestHeaders
}

/**
 * Custom fetch helper overriding HTTP GET method
 * @param {Object} data - Fetcher data object
 * @param {string} data.url - URL of the server that will be used for the request
 * @param {Object} data.params - URL prameters that will be sent with the request
 */
const fetcher = ({ url, params, headers, responseType }: Read) =>
  axios
    .get(url, {
      params,
      headers,
      responseType
    })
    .then((res) => res.data)

/**
 * Custom create helper overriding HTTP POST method
 * @param {Object} data - Creator data object
 * @param {string} data.url - URL of the server that will be used for the request
 * @param {Object} data.params - URL prameters that will be sent with the request
 * @param {Object} data.body - Body that will be sent with the request
 */
const creator = ({ url, params, body, headers }: Write) =>
  axios
    .post(url, body, {
      params,
      headers
    })
    .then((res) => res.data)

/**
 * Custom create helper overriding HTTP PUT method
 * @param {Object} data - Modifier data object
 * @param {string} data.url - URL of the server that will be used for the request
 * @param {Object} data.params - URL prameters that will be sent with the request
 * @param {Object} data.body - Body that will be sent with the request
 */
const modifier = ({ url, params, body, headers }: Write) =>
  axios
    .put(url, body, {
      params,
      headers
    })
    .then((res) => res.data)

/**
 * Custom remover helper overriding HTTP Delete method
 * @param {Object} data - Remove data object
 * @param {string} data.url - URL of the server that will be used for the request
 * @param {Object} data.body - Body that will be sent with the request
 */
const remover = ({ url, headers }: Remove) => axios.delete(url, { headers }).then((res) => res.data)

export { fetcher, creator, modifier, remover }
