import nconf from '../nconf'
import assert from 'assert'
import passport from 'koa-passport'
import UserHandler from '../handler/UserHandler'
import * as AccessLevel from '../../common/AccessLevels'

/**
 * Login endpoint.
 *
 * https://developer.github.com/v3/oauth/#scopes
 */
export function login(router) {
  return router.get('/auth/github', (ctx, next) => {
    const scopesPerMode = nconf.get('GITHUB_ACCESS_LEVELS')
    const mode = ctx.cookies.get(AccessLevel.COOKIE_NAME)
    const scope = scopesPerMode[mode]
    return passport.authenticate('github', {scope})(ctx, next)
  })
}

/**
 * Ensures that all of the following is true:
 *  - there is a cookie `zappr_access_level`
 *  - the cookie contains what's in the database for this user
 *  - the access token available in the request context has proper scopes for the selected zappr mode
 *
 * This is done by redirecting to /change-mode if cookie is not there or not equal to database content.
 */
export async function ensureModeMiddleware(ctx, next) {
  const user = ctx.req.user
  if (!!user) {
    const {access_level} = await UserHandler.onGet(user.id)
    const zapprCookie = ctx.cookies.get(AccessLevel.COOKIE_NAME)
    if (access_level !== zapprCookie) {
      // database beats cookie
      ctx.redirect(`/change-mode?mode=${access_level}`)
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
    if (AccessLevel.MODES.indexOf(mode) === -1) {
      ctx.throw(400)
    }
    try {
      await UserHandler.onChangeLevel(ctx.req.user.id, mode)
      const IN_PRODUCTION = nconf.get('NODE_ENV') === 'production'
      ctx.cookies.set(AccessLevel.COOKIE_NAME, mode, {
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
