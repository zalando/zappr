import passport from 'koa-passport'
import { Strategy as GithubStrategy } from 'passport-github'

import nconf from './nconf'
import { User } from './model'

import { logger } from '../common/debug'
const log = logger('passport')

const GITHUB_CLIENT_ID = nconf.get('GITHUB_CLIENT_ID')
const GITHUB_CLIENT_SECRET = nconf.get('GITHUB_CLIENT_SECRET')
const GITHUB_MAIN_ADDR = nconf.get('GITHUB_MAIN_ADDR')
const GITHUB_API_ADDR = nconf.get('GITHUB_API_ADDR')
const HOST_ADDR = nconf.get('HOST_ADDR')

/**
 * Merge Passport and Github user profiles.
 *
 * http://passportjs.org/docs/profile
 * https://developer.github.com/v3/users/#get-a-single-user
 */
function normalizeProfile(profile) {
  const { id, _json, _raw, ...rest } = profile
  const normalizedProfile = {...rest, ..._json}
  return normalizedProfile
}

/**
 * @param {string} root - http(s)://domain
 * @param {string} path - /some/path
 * @returns {string} - http(s)://domain/some/path
 */
function urlJoin(root, path) {
  return `${root.replace(/\/$/, '')}/${path.replace(/^\//, '')}`
}

/**
 * Configure and return passport instance.
 *
 * @param Strategy - Passport authentication strategy
 * @returns {Authenticator} - Passport instance
 */
export function init(Strategy = GithubStrategy) {
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
    User.findById(data.id)
        .then(user => user
          ? user.flatten()
          : null)
        .then(user => user
          ? done(null, {...user, ...data})
          : done(new Error(`no user for id ${data.id}`)))
  })

  passport.use(new Strategy({
      // See https://developer.github.com/v3/oauth
      clientID: GITHUB_CLIENT_ID,
      clientSecret: GITHUB_CLIENT_SECRET,
      callbackURL: urlJoin(HOST_ADDR, 'auth/github/callback'),
      authorizationURL: urlJoin(GITHUB_MAIN_ADDR, 'login/oauth/authorize'),
      tokenURL: urlJoin(GITHUB_MAIN_ADDR, 'login/oauth/access_token'),
      userProfileURL: urlJoin(GITHUB_API_ADDR, 'user')
    },
    (accessToken, refreshToken, profile, done) => {
      // Add the accessToken to the returned object so that it is stored in the session.
      // DO NOT persist the accessToken in the user data.
      log(`verify profile id: ${profile.id} username: ${profile.username}`)

      // Clean up the user profile data
      const {id, ...userData} = normalizeProfile(profile)
      const data = {id, accessToken} // the session data

      User.upsert({id, json: userData})
          .then(() => done(null, data))
          .catch(done)
    }
  ))

  return passport
}
