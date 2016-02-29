import React, { Component, PropTypes } from 'react'
import { Provider } from 'react-redux'
import { Router, browserHistory } from 'react-router'

import routes from './routes.jsx'

export default class Root extends Component {
  static propTypes = {
    store: PropTypes.object.isRequired
  };

  render() {
    return (
      <Provider store={this.props.store}>
        <Router history={browserHistory}>
          {routes}
        </Router>
      </Provider>
    )
  }
}
