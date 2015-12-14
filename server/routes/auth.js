import passport from 'koa-passport'
import {Strategy as GitHubStrategy} from 'passport-github2'

import {config} from '../config'

const GITHUB_CLIENT_ID = config.get('GITHUB_CLIENT_ID')
const GITHUB_CLIENT_SECRET = config.get('GITHUB_CLIENT_SECRET')
const HOST_ADDR = config.get('HOST_ADDR')

// https://github.com/cfsghost/passport-github/blob/master/examples/login/app.js
passport.serializeUser((user, done) => {
  done(null, user)
})

passport.deserializeUser((obj, done) => {
  done(null, obj)
})

passport.use(new GitHubStrategy({
    clientID: GITHUB_CLIENT_ID,
    clientSecret: GITHUB_CLIENT_SECRET,
    callbackURL: `${HOST_ADDR}/auth/github/callback`
  },
  (accessToken, refreshToken, profile, done) => {
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
    successRedirect: '/?auth=true',
    failureRedirect: '/?auth=false'
  }))
}

/**
 * Logout endpoint.
 */
export function logout(router) {
  return router.get('logout', '/logout', ctx => {
    ctx.logout()
    ctx.redirect('/?auth=false')
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
