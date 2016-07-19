import Koa from 'koa'
import Router from 'koa-router'
import { getCurrentMetrics } from './middleware/prometheus'

export function metrics(router) {
  return router.get('/metrics', ctx => {
    ctx.body = getCurrentMetrics()
  })
}

export default function initMetrics() {
  const metricsRouter = metrics(Router())
  const metricsApp = new Koa()
  return metricsApp.use(metricsRouter.routes())
                   .use(metricsRouter.allowedMethods())
}
