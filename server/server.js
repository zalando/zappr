import Koa from 'koa'
import KoaRouter from 'koa-router'
import KoaStatic from 'koa-static'

import health from './routes/health'

export const app = Koa()

const router = [health].
reduce((router, route) => route(router), KoaRouter())

app.
use(router.routes()).
use(router.allowedMethods()).
use(KoaStatic('dist/client', {defer: true}))

if (require.main === module) {
  app.listen(3000)
}
