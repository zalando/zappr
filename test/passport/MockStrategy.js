import Strategy from 'passport-strategy'

/**
 * Mock GithubStrategy from passport-github2.
 */
export default class MockStrategy extends Strategy {
  static props = {
    accessToken: null,
    refreshToken: null,
    user: {
      id: 1,
      username: 'test',
      _json: {
        id: 1
      }
    }
  };

  constructor(options, verify) {
    super()
    this.name = 'github'
    this.options = options
    this.verify = verify
  }

  authenticate(req, options) {
    const {accessToken, refreshToken, user} = MockStrategy.props
    this.verify(accessToken, refreshToken, user, (err, data) => {
      if (err) this.fail(err)
      else this.success(data)
    })
  }
}
