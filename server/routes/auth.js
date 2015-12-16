import passport from 'koa-passport'
import { Strategy as GitHubStrategy } from 'passport-github2'

import { config } from '../config'
import { logger } from '../../common/debug'

const GITHUB_CLIENT_ID = config.get('GITHUB_CLIENT_ID')
const GITHUB_CLIENT_SECRET = config.get('GITHUB_CLIENT_SECRET')
const HOST_ADDR = config.get('HOST_ADDR')

const log = logger('auth')

// https://github.com/cfsghost/passport-github/blob/master/examples/login/app.js

/**
 * Serialize user into the session.
 */
passport.serializeUser((user, done) => {
  // TODO: just put the user id into the session and store the user data in the database
  log(`serializeUser id: ${user.id} username: ${user.username}`)
  done(null, user)
})

/**
 * Deserialize user out of the session.
 */
passport.deserializeUser((obj, done) => {
  // TODO: get the user data from the database by id
  log(`deserializeUser id: ${obj.id} username: ${obj.username}`)
  done(null, obj)
})

passport.use(new GitHubStrategy({
    clientID: GITHUB_CLIENT_ID,
    clientSecret: GITHUB_CLIENT_SECRET,
    callbackURL: `${HOST_ADDR}/auth/github/callback`
  },
  (accessToken, refreshToken, profile, done) => {
    // TODO: get existing user record or create new user in the database
    // Add the accessToken to the returned object so that it is stored in the session.
    // DO NOT persist the accessToken in the database.
    log(`verify profile id: ${profile.id} username: ${profile.username}`)
    done(null, profile)
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
    ctx.redirect('/login?status=logout')
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
