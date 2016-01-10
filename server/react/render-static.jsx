import glob from 'glob'
import path from 'path'
import React from 'react'
import ReactDOMServer from 'react-dom/server'
import { match, RoutingContext } from 'react-router'

import nconf from '../nconf'
import configureStore from '../../client/store/configureStore'
import routes from '../../client/containers/routes.jsx'

import Index from './index.jsx'

import { logger } from '../../common/debug'
const log = logger('react')

/**
 * Yield filenames matching a pattern.
 *
 * @param pattern
 * @returns {Promise.<string>}
 */
function find(pattern) {
  return new Promise((resolve, reject) =>
    glob(pattern, (err, result) =>
      err ? reject(err) : resolve(result.map(f => path.basename(f)))
    )
  )
}

/**
 * Yield assets from the static dir.
 *
 * @returns {Promise.<object>}
 */
export function getStaticAssets() {
  const dir = nconf.get('STATIC_DIR')

  return Promise.all([
    find(path.join(dir, '*.js')),
    find(path.join(dir, '*.css'))
  ]).
  then(([js, css]) => ({
    js,
    css
  }))
}

function filterUserObject(user = {}) {
  return [
    'id',
    'login',
    'avatar_url',
    'html_url',
    'displayName'
  ].reduce((obj, key) => {
    obj[key] = user[key]
    return obj
  }, {})
}

export default async function renderStatic(ctx, next) {

  const assets = await getStaticAssets()
  const user = filterUserObject(ctx.req.user)

  const store = configureStore({
    auth: {
      isAuthenticated: !!user.id
    },
    router: {
      path: ctx.url
    },
    user
  })

  match({routes, location: ctx.url}, (err, redirectLocation, renderProps) => {
    if (err) {
      log('error', error.message)
      ctx.throw(500, error.message)
    } else if (redirectLocation) {
      log('redirect', redirectLocation)
      ctx.redirect(302, redirectLocation.pathname + redirectLocation.search)
    } else if (renderProps) {
      const props = {...assets, store, renderProps}
      ctx.body = ReactDOMServer.renderToStaticMarkup(<Index {...props}/>)
    } else {
      next()
    }
  })
}
