import React from 'react'

import { Provider } from 'react-redux'
import { Router, browserHistory } from 'react-router'

import routes from './routes.jsx'

export default class Root extends React.Component {
  static propTypes = {
    store: React.PropTypes.object.isRequired
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
