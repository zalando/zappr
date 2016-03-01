import React, { Component, PropTypes } from 'react'
import { connect } from 'react-redux'
import { Row, Col } from 'react-bootstrap'

import Optional from '../components/Optional.jsx'
import RepositoryBrowser from '../components/RepositoryBrowser.jsx'
import { setRepoEnabled } from '../actions/repo'

function mapStateToProps(state) {
  return {
    githubRepos: state.githubRepos
  }
}

class Home extends Component {
  static propTypes = {
    params: PropTypes.object.isRequired, // React Router route params
    githubRepos: PropTypes.object.isRequired,
    setRepoEnabled: PropTypes.func.isRequired // TODO: should 
  };

  render() {
    const style = {
      spinner: {padding: '100px', color: '#663931'}
    }
    const {repos, isFetching} = this.props.githubRepos
    const selectedRepo = this.props.params.repository

    return (
      <Row className="zpr-home">
        <Col md={12}>
          <Optional if={isFetching}>
            <div className="text-center" style={style.spinner}>
              <i className="fa fa-circle-o-notch fa-spin fa-5x"/>
            </div>
          </Optional>
          <RepositoryBrowser selected={selectedRepo}
                             repositories={repos}
                             toggleRepoCheck={this.props.setRepoEnabled}/>
        </Col>
      </Row>
    )
  }
}

export default connect(mapStateToProps, {setRepoEnabled})(Home)
