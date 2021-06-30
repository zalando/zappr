import requestFn from 'request'
import crypto from 'crypto'
import nconf from './nconf'
import { logger } from '../common/debug'

const log = logger('serverUtil')

// Request retry configs
const requestRetryInterval = nconf.get('EXTERNAL_REQUEST_RETRY_DELAY')
const maxRequestRetryInterval = nconf.get('MAX_EXTERNAL_REQUEST_RETRY_DELAY')

export function jsonHash(json, algo = 'sha256') {
  const hash = crypto.createHash(algo)
  hash.update(new Buffer(JSON.stringify(json)))
  return hash.digest('hex')
}

// Internal function for actually making requests
var requestDoer = function(resolve, reject, ...args) {
  requestFn(...args, (err, ...rest) => {
    if (err) {
      reject(err)
    } else {
      resolve(rest)
    }
  })
}

// Returns a function that resolves a promise and potentially retries the request if the response status code is 5xx
var retryResolver = function(resolve, reject, retryDelay, maxRetryDelay, ...args) {
  return (value) => {
    // max backoff
    if (retryDelay > maxRetryDelay) {
      resolve(value)
      return
    }

    // null resolve result, nothing to extract from
    if (!value) {
      resolve(value)
      return
    }

    // The result is an array and we can extract the status code
    if (Array.isArray(value) && value.length > 0 && value[0] && value[0].statusCode && value[0].statusCode >= 500) {
      log(`Received a retryable http response code: ${value[0].statusCode}. retrying after ${retryDelay}ms...`)
      new Promise(presolve => setTimeout(() => presolve(), retryDelay))
      .then(() => requestDoer(retryResolver(resolve, reject, retryDelay * 2, maxRetryDelay, ...args), reject, ...args));
      return
    }

    // The result is a plain object with the status code attribute
    if(value.statusCode && value.statusCode >= 500) {
      log(`Received a retryable http response code: ${value[0].statusCode}. retrying after ${retryDelay}ms...`)
      new Promise(presolve => setTimeout(() => presolve(), retryDelay))
      .then(() => requestDoer(retryResolver(resolve, reject, retryDelay * 2, maxRetryDelay, ...args), reject, ...args));
      return
    }

    // unfortunately, we could not extract the status to determine if a retry should be done, simply resolve the promise
    resolve(value)
  }
}

// Sets the internal function that's used for making actual http request. This is typically useful for stubbing for test purposes
export function setRequestDoer(requestDoerFn) {
  requestDoer = requestDoerFn;
}

// Executes an http request based on provided parameters
export function request(...args) {
  return new Promise((resolve, reject) => {
    requestDoer(retryResolver(resolve, reject, requestRetryInterval, maxRequestRetryInterval, ...args), reject, ...args)
  })
}
