import glob from 'glob'
import path from 'path'
import React from 'react'
import ReactDOMServer from 'react-dom/server'
import { match } from 'react-router'

import nconf from '../nconf'
import configureStore from '../../client/store/configureStore'
import routes from '../../client/components/Routes.jsx'
import Index from './Index.jsx'
import * as AccessLevel from '../../common/AccessLevels'
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
                ])
                .then(([js, css]) => ({
                  js,
                  css
                }))
}

export default async function renderStatic(ctx, next) {

  const assets = await getStaticAssets()
  const user = ctx.req.user ? ctx.req.user.json : {}
  // at this point the cookie is guaranteed to exist due to previous middleware
  const usingExtendedAccess = ctx.cookies.get(AccessLevel.COOKIE_NAME) === AccessLevel.EXTENDED
  const isAuthenticated = ctx.isAuthenticated()

  const store = configureStore({
    auth: {
      isAuthenticated
    },
    env: {
      GITHUB_UI_URL: nconf.get('GITHUB_UI_URL'),
      USING_EXTENDED_ACCESS: usingExtendedAccess
    },
    user
  })
  match({routes, location: ctx.url}, (err, redirectLocation, renderProps) => {
    if (err) {
      log('error', error.message)
      ctx.throw(500, error.message)
    } else if (redirectLocation) {
      log('redirect', redirectLocation)
      ctx.redirect(redirectLocation.pathname + redirectLocation.search)
    } else if (ctx.path === '/' && !isAuthenticated) {
      ctx.redirect('/login')
    } else if (renderProps) {
      const props = {...assets, store, renderProps}
      ctx.body = ReactDOMServer.renderToStaticMarkup(<Index {...props}/>)
    } else {
      next()
    }
  })
}
