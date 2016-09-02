import React, { Component, PropTypes } from 'react'
import ReactCookieBanner, { cookie } from 'react-cookie-banner'

const MESSAGE = 'If you continue to browse this website, you are accepting third-party cookies.'
const URL = 'https://zappr.readthedocs.io/en/latest/cookies'
const BUTTON_MESSAGE = 'Accept'
const COOKIE = 'user-has-accepted-cookies'

const styles = {banner: {backgroundColor: 'rgb(102, 102, 102)'}}

export default class CookieBanner extends Component {
  static isCookieSet() {
    return !!cookie(COOKIE)
  }

  static setCookie() {
    cookie(COOKIE, true)
  }

  static deleteCookie() {
    cookie(COOKIE, "", -1)
  }

  render() {
    if (typeof window === 'undefined') return null
    return <ReactCookieBanner
      message={MESSAGE}
      link={{
        url: URL,
        target: '_blank'
      }}
      buttonMessage={BUTTON_MESSAGE}
      cookie={COOKIE}
      styles={styles}
      dismissOnScroll={false}/>
  }
}
