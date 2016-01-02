import passport from 'koa-passport'
import { Strategy as GitHubStrategy } from 'passport-github2'

import UserRepository from '../persistence/user-repository'
import config from '../config'

const GITHUB_CLIENT_ID = config.get('GITHUB_CLIENT_ID')
const GITHUB_CLIENT_SECRET = config.get('GITHUB_CLIENT_SECRET')
const HOST_ADDR = config.get('HOST_ADDR')

import { logger } from '../../common/debug'
const log = logger('auth')

const userRepo = new UserRepository()

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
  const { id, accessToken } = data
  userRepo.findOne(id).then((user) => done(null, {...user, accessToken})).catch(done)
})

/**
 * http://passportjs.org/docs/profile
 * https://developer.github.com/v3/users/#get-a-single-user
 */
function normalizeProfile(profile) {
  const { id, _json, _raw, ...rest } = profile
  const normalizedProfile = { ...rest, ..._json }
  return normalizedProfile
}

passport.use(new GitHubStrategy({
    clientID: GITHUB_CLIENT_ID,
    clientSecret: GITHUB_CLIENT_SECRET,
    callbackURL: `${HOST_ADDR}/auth/github/callback`
  },
  (accessToken, refreshToken, profile, done) => {
    // Add the accessToken to the returned object so that it is stored in the session.
    // DO NOT persist the accessToken in the database.
    log(`verify profile id: ${profile.id} username: ${profile.username}`)

    // Clean up the user profile data
    const normalizedProfile = normalizeProfile(profile)
    const id = normalizedProfile.id

    const data = { id, accessToken } // the session data
    userRepo.save(normalizedProfile).then(() => done(null, data)).catch(done)
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
