import { request } from '../util'
import Strategy from 'passport-strategy'
import { joinURL } from '../../common/util'

// Internals of passport-github that we rely on
// https://github.com/jaredhanson/passport-github/blob/master/lib/profile.js
function bodyToProfile(body) {
  let json
  if ('string' == typeof body) {
    json = JSON.parse(body);
  } else {
    json = body
  }

  var profile = {};
  profile.id = String(json.id);
  profile.displayName = json.name;
  profile.username = json.login;
  profile.profileUrl = json.html_url;
  if (json.email) {
    profile.emails = [{ value: json.email }];
  }
  if (json.avatar_url) {
    profile.photos = [{ value: json.avatar_url }];
  }

  profile._json = json
  profile._raw = body

  return profile;
}

export default class GithubAPIStrategy extends Strategy {
  constructor(options, verify) {
    super(options, verify)
    const {apiUrl = 'https://api.github.com', tokenType = 'token', userAgent = 'passport-github-api'} = options
    this.name = 'github-api'
    this.apiUrl = apiUrl
    this.tokenType = tokenType
    this.userAgent = userAgent
    this.verify = verify
  }

  async authenticate(req) {
    const {headers} = req
    const AUTH_HEADER = headers['authorization']
    if (!AUTH_HEADER) this.error('No Authorization error present')
    const [type, token] = AUTH_HEADER.split(' ')
    if (type !== this.tokenType) this.error('Invalid token type')
    if (!token || !token.length) this.error('No token provided')

    const [response, bodyString] = await request({
      method: 'GET',
      url: joinURL(this.apiUrl, '/user'),
      headers: {
        'User-Agent': this.userAgent,
        'Authorization': `token ${token}`
      }
    })

    let body
    try {
      body = JSON.parse(bodyString)
    } catch(e) {
      return this.fail(e)
    }

    const verifyFn = (err, user) => {
      if (err || !user) {
        return this.error(err);
      }

      this.success(user);
    }

    if (response.statusCode === 200) {
      this.verify(token, bodyToProfile(body), verifyFn)
    } else {
      this.error(body)
    }
  }
}
