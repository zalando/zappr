import React from 'react'
import ReactDOMServer from 'react-dom/server'
import { match, RoutingContext } from 'react-router'

import { getAssets } from './app-cache'

const Index = React.createFactory(require('./index.jsx').default)
import { getRoutes } from '../../client/containers/root.jsx'
import configureStore from '../../client/store/configureStore'

import { logger } from '../../common/debug'
const log = logger('react')

export default async function renderStatic(ctx, next) {
  const routes = getRoutes()
  const assets = await getAssets()

  // passport user object http://passportjs.org/docs/profile
  const user = ctx.req.user || {}

  const store = configureStore({
    auth: {
      isAuthenticated: !!user.id
    },
    user
  })

  const props = {
    ...assets,
    store,
    routerContext: RoutingContext
  }

  match({routes, location: ctx.url}, (err, redirectLocation, renderProps) => {
    if (err) {
      log('error', error.message)
      ctx.throw(500, error.message)
    } else if (redirectLocation) {
      log('redirect', redirectLocation)
      ctx.throw(302, redirectLocation)
      //ctx.redirect(302, redirectLocation.pathname + redirectLocation.search)
    } else if (renderProps) {
      ctx.body = ReactDOMServer.renderToStaticMarkup(Index(props))
    } else {
      next()
    }
  })
}
