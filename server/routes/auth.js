import passport from 'koa-passport'
import getStrategy from '../passport/strategy'

import { User } from '../model'
import config from '../config'

const GITHUB_CLIENT_ID = config.get('GITHUB_CLIENT_ID')
const GITHUB_CLIENT_SECRET = config.get('GITHUB_CLIENT_SECRET')
const HOST_ADDR = config.get('HOST_ADDR')

import { logger } from '../../common/debug'
const log = logger('auth')

/**
 * Serialize user data into the session.
 */
passport.serializeUser((data, done) => {
  log(`serializeUser id: ${data.id}`)
  done(null, data)
})

/**
 * Deserialize user profile out of the session.
 */
passport.deserializeUser((data, done) => {
  log(`deserializeUser id: ${data.id}`)
  User.findById(data.id).
  then(user => user ? user.get('json') : null).
  then(json => JSON.parse(json)).
  then(userData => done(null, {...userData, ...data})).
  catch(done)
})

/**
 * http://passportjs.org/docs/profile
 * https://developer.github.com/v3/users/#get-a-single-user
 */
function normalizeProfile(profile) {
  const { id, _json, _raw, ...rest } = profile
  const normalizedProfile = {...rest, ..._json}
  return normalizedProfile
}

const PassportStrategy = getStrategy()

passport.use(new PassportStrategy({
    clientID: GITHUB_CLIENT_ID,
    clientSecret: GITHUB_CLIENT_SECRET,
    callbackURL: `${HOST_ADDR}/auth/github/callback`
  },
  (accessToken, refreshToken, profile, done) => {
    // Add the accessToken to the returned object so that it is stored in the session.
    // DO NOT persist the accessToken in the user data.
    log(`verify profile id: ${profile.id} username: ${profile.username}`)

    // Clean up the user profile data
    const {id, ...userData} = normalizeProfile(profile)
    const data = {id, accessToken} // the session data

    User.upsert({
      id,
      json: userData
    }).
    then(() => done(null, data)).
    catch(done)
  }
))

/**
 * Login endpoint.
 *
 * https://developer.github.com/v3/oauth/#scopes
 */
export function login(router) {
  return router.get('login', '/auth/github', passport.authenticate('github', {
    scope: config.get('GITHUB_SCOPES')
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
export function requireAuth(ctx, next) {
  if (ctx.isAuthenticated()) {
    return next()
  } else {
    ctx.throw(401)
  }
}
