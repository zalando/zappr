import Strategy from 'passport-strategy'

const accessToken = null
const refreshToken = null
const profile = {
  username: 'test',
  _json: {
    id: 1
  }
}

export default class MockStrategy extends Strategy {
  constructor(options, verify) {
    super()
    this.name = 'github'
    this.options = options
    this.verify = verify
  }

  authenticate(req, options) {
    this.verify(accessToken, refreshToken, profile, (err, data) => {
      if (err) this.fail(err)
      else this.success(data)
    })
  }
}
