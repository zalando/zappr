import passport from 'koa-passport'
import { Strategy as GithubStrategy } from 'passport-github'
import GithubAPIStrategy from './passport-github-api'
import nconf from '../nconf'
import { User } from './../model'
import { joinURL } from '../../common/util'
import { logger } from '../../common/debug'

const GITHUB_CLIENT_ID = nconf.get('GITHUB_CLIENT_ID')
const GITHUB_CLIENT_SECRET = nconf.get('GITHUB_CLIENT_SECRET')
const GITHUB_UI_URL = nconf.get('GITHUB_UI_URL')
const GITHUB_API_URL = nconf.get('GITHUB_API_URL')
const HOST_ADDR = nconf.get('HOST_ADDR')
const log = logger('passport')

/**
 * Merge Passport and Github user profiles.
 *
 * http://passportjs.org/docs/profile
 * https://developer.github.com/v3/users/#get-a-single-user
 */
function normalizeProfile(profile) {
  const {_raw, _json, ...rest} = profile
  const normalizedProfile = {...rest, ..._json}
  return normalizedProfile
}

/**
 * Configure and return passport instance.
 *
 * @returns {Authenticator} - Passport instance
 */
export function init() {
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
          ? user.toJSON()
          : null)
        .then(user => user
          ? done(null, {...user, ...data})
          : done(new Error(`no user for id ${data.id}`)))
  })
  
  passport.use(new GithubAPIStrategy({
      apiUrl: GITHUB_API_URL
    },
    (accessToken, profile, done) =>
      // make it look like it came from the database
      done(null, {id: profile.id, accessToken, json: normalizeProfile(profile)})
  ))

  passport.use(new GithubStrategy({
      // See https://developer.github.com/v3/oauth
      clientID: GITHUB_CLIENT_ID,
      clientSecret: GITHUB_CLIENT_SECRET,
      callbackURL: joinURL(HOST_ADDR, 'auth/github/callback'),
      authorizationURL: joinURL(GITHUB_UI_URL, 'login/oauth/authorize'),
      tokenURL: joinURL(GITHUB_UI_URL, 'login/oauth/access_token'),
      userProfileURL: joinURL(GITHUB_API_URL, 'user')
    },
    (accessToken, refreshToken, profile, done) => {
      // Add the accessToken to the returned object so that it is stored in the session.
      // DO NOT persist the accessToken in the user profile.
      log(`verify profile id: ${profile.id} username: ${profile.username}`)

      // Clean up the user profile data
      const user = normalizeProfile(profile)
      // The session data:
      const data = {id: user.id, accessToken}

      User.upsert({id: user.id, json: user})
          .then(() => done(null, data))
          .catch(done)
    }
  ))

  return passport
}
