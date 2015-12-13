/**
 * Health check endpoint.
 */
export default function (router) {
  return router.get('health', '/health', function *() {
    this.body = 'OK'
  })
}
