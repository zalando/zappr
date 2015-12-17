import passport from 'koa-passport'
import { Strategy as GitHubStrategy } from 'passport-github2'

import { Database } from '../persistence'
import config from '../config'

const GITHUB_CLIENT_ID = config.get('GITHUB_CLIENT_ID')
const GITHUB_CLIENT_SECRET = config.get('GITHUB_CLIENT_SECRET')
const HOST_ADDR = config.get('HOST_ADDR')

import { logger } from '../../common/debug'
const log = logger('auth')

// https://github.com/cfsghost/passport-github/blob/master/examples/login/app.js

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
  const db = Database.instance()
  const { id, accessToken } = data
  db.get(id).then((user) => done(null, {...user, accessToken})).catch(done)
})

/**
 * http://passportjs.org/docs/profile
 */
function normalizeProfile(profile) {
  const { id, _json, _raw, ...rest } = profile
  const normalizedProfile = { ...rest, ..._json }
  normalizedProfile.photos =  normalizedProfile.photos || [normalizedProfile.avatar_url]
  normalizedProfile.url = normalizedProfile.html_url
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

    const db = Database.instance()
    const data = { id, accessToken } // the session data
    db.put(id, normalizedProfile).then(() => done(null, data)).catch(done)
  }
))

/**
 * Login endpoint.
 */
export function login(router) {
  return router.get('login', '/auth/github', passport.authenticate('github', {
    scope: ['user:email']
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
