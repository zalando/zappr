/**
 * Health check endpoint.
 */
export function health(router) {
  return router.get('health', '/health', ctx => {
    ctx.body = 'OK'
  })
}
