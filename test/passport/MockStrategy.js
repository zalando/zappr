import Strategy from 'passport-strategy'
import { logger } from '../../common/debug'

const log = logger('test')

const props = {
  accessToken: 'abcd',
  refreshToken: null,
  user: {
    id: 1,
    accessToken: 'abcd',
    username: 'test',
    _json: {
      id: 1
    }
  }
}

export function setUserId(id) {
  props.user.id = id
  props.user._json.id = id
}

export function setUserName(name) {
  props.user.username = name
}

/**
 * Mock GithubStrategy from passport-github.
 */
export default class MockStrategy extends Strategy {
  constructor(options, verify) {
    super()
    this.name = 'github'
    this.options = options
    this.verify = verify
  }

  authenticate(req, options) {
    const {accessToken, refreshToken, user} = props
    this.verify(accessToken, refreshToken, user, (err, data) => {
      log('MockStrategy authenticate.verify accessToken: %s refreshToken: %s' +
        'user: %o error: %o data: %o', accessToken, refreshToken, user, err, data)
      if (err) this.fail(err)
      else this.success(data)
    })
  }
}
