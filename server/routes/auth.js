import nconf from '../nconf'
import assert from 'assert'
import passport from 'koa-passport'
import UserHandler from '../handler/UserHandler'
import * as Mode from '../../common/ZapprModes'

/**
 * Login endpoint.
 *
 * https://developer.github.com/v3/oauth/#scopes
 */
export function login(router) {
  return router.get('/auth/github', (ctx, next) => {
    const inExtendedMode = ctx.cookies.get(Mode.COOKIE_NAME) === Mode.EXTENDED
    const scope = nconf.get(inExtendedMode ? 'GITHUB_SCOPES_EXTENDED' : 'GITHUB_SCOPES')
    return passport.authenticate('github', {scope})(ctx, next)
  })
}

/**
 * Ensures that all of the following is true:
 *  - there is a cookie `zappr_mode`
 *  - the cookie contains what's in the database for this user
 *  - the access token available in the request context has proper scopes for the selected zappr mode
 *
 * This is done by redirecting to /change-mode if cookie is not there or not equal to database content.
 */
export async function ensureModeMiddleware(ctx, next) {
  const user = ctx.req.user
  if (!!user) {
    const {zappr_mode} = await UserHandler.onGet(user.id)
    const zapprCookie = ctx.cookies.get(Mode.COOKIE_NAME)
    if (zappr_mode !== zapprCookie) {
      // database beats cookie
      ctx.redirect(`/change-mode?mode=${zappr_mode}`)
    }
  }
  // not sure why we have to await here
  await next()
}

/**
 * Change between Zappr modes. Updates database, sets cookie, then redirects to /auth/github.
 */
export function changeMode(router) {
  return router.get('/change-mode', requireAuth, async(ctx, next) => {
    const mode = ctx.query.mode
    if (Mode.MODES.indexOf(mode) === -1) {
      ctx.throw(400)
    }
    try {
      await UserHandler.onChangeMode(ctx.req.user.id, mode)
      const IN_PRODUCTION = nconf.get('NODE_ENV') === 'production'
      ctx.cookies.set(Mode.COOKIE_NAME, mode, {
        httpOnly: true,
        signed: IN_PRODUCTION,
        secure: IN_PRODUCTION,
        maxAge: 3.6 * (10 ** 10) // in milliseconds - equals roughly 1 year
      })
      ctx.redirect('/auth/github')
    } catch (e) {
      ctx.throw(e)
    }
    next()
  })
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
  return router.get('/logout', ctx => {
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
