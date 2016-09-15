import nconf from '../nconf'
import passport from 'koa-passport'
import UserHandler from '../handler/UserHandler'
import * as AccessLevel from '../../common/AccessLevels'
import {logger} from '../../common/debug'

const info = logger('api-auth', 'info')

/**
 * Login endpoint.
 *
 * https://developer.github.com/v3/oauth/#scopes
 */
export function login(router) {
  return router.get('/auth/github', (ctx, next) => {
    const scopesPerAccessLevel = nconf.get('GITHUB_ACCESS_LEVELS')
    const level = ctx.cookies.get(AccessLevel.COOKIE_NAME)
    const scope = scopesPerAccessLevel[level]
    return passport.authenticate('github', {scope})(ctx, next)
  })
}

/**
 * Ensures that all of the following is true:
 *  - there is a cookie `zappr_access_level`
 *  - the cookie contains what's in the database for this user
 *  - the access token available in the request context has proper scopes for the selected zappr mode
 *
 * This is done by redirecting to /change-access-level if cookie is not there or not equal to database content.
 */
export async function ensureModeMiddleware(ctx, next) {
  const user = ctx.req.user
  info(`ensureMode start`)
  if (!!user) {
    info(`ensureMode:${user.json.login}`)
    const {access_level} = await UserHandler.onGet(user.id)
    info(`ensureMode:${user.json.login}: level = "${access_level}" (DB)`)
    const accessLevelCookie = ctx.cookies.get(AccessLevel.COOKIE_NAME)
    info(`ensureMode:${user.json.login}: level = "${accessLevelCookie}" (COOKIE)`)
    if (access_level !== accessLevelCookie) {
      info(`ensureMode:${user.json.login}: MISMATCH! CHANGING TO "${access_level}"!`)
      // database beats cookie
      ctx.redirect(`/change-access-level?level=${access_level}`)
    }
  }
  info(`ensureMode end`)
  // for some reason only works with await
  await next()
}

/**
 * Change between Zappr modes. Updates database, sets cookie, then redirects to /auth/github.
 */
export function changeMode(router) {
  return router.get('/change-access-level', requireAuth, async(ctx, next) => {
    const level = ctx.query.level
    if (AccessLevel.MODES.indexOf(level) === -1) {
      ctx.throw(400)
    }
    try {
      await UserHandler.onChangeLevel(ctx.req.user.id, level)
      const IN_PRODUCTION = nconf.get('NODE_ENV') === 'production'
      ctx.cookies.set(AccessLevel.COOKIE_NAME, level, {
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
