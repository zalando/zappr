import nconf from '../nconf'
import passport from 'koa-passport'

/**
 * Login endpoint.
 *
 * https://developer.github.com/v3/oauth/#scopes
 */
export function login(router) {
  return router.get('login', '/auth/github', passport.authenticate('github', {
    scope: nconf.get('GITHUB_SCOPES')
  }))
}

/**
 * Authorization callback endpoint.
 */
export function authorize(router) {
  return router.get('/auth/github/callback', passport.authenticate('github', {
    successRedirect: '/',
    failureRedirect: '/login?status=failure'
  }))
}

/**
 * Logout endpoint.
 */
export function logout(router) {
  return router.get('logout', '/logout', ctx => {
    ctx.logout()
    ctx.session = null
    ctx.redirect('/login')
  })
}

/**
 * Middleware to require authentication.
 */
export async function requireAuth(ctx, next) {
  if (ctx.isAuthenticated()) {
    return next()
  } else {
    return passport.authenticate('github-api', {session: false})(ctx, next)
  }
}
