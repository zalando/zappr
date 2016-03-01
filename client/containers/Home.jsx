import React, { Component, PropTypes } from 'react'
import { connect } from 'react-redux'
import { Row, Col } from 'react-bootstrap'

import Repo from '../components/Repo.jsx'
import Optional from '../components/Optional.jsx'
import { setRepoEnabled } from '../actions/repo'

function mapStateToProps(state) {
  return {
    githubRepos: state.githubRepos
  }
}

class Home extends Component {
  static propTypes = {
    githubRepos: PropTypes.object.isRequired,
    setRepoEnabled: PropTypes.func.isRequired
  };

  render() {
    const style = {
      spinner: {padding: '100px', color: '#663931'}
    }
    const {repos, isFetching} = this.props.githubRepos
    const {setRepoEnabled} = this.props

    return (
      <Row className="zpr-home">
        <Col md={8} mdPush={2}>
          <Optional if={isFetching}>
            <div className="text-center" style={style.spinner}>
              <i className="fa fa-circle-o-notch fa-spin fa-5x"/>
            </div>
          </Optional>
          {repos.map((repo, i) => (
            <Repo key={i} repo={repo} onToggle={(isActive) => setRepoEnabled(repo.id, isActive)}/>
          ))}
        </Col>
      </Row>
    )
  }
}

export default connect(mapStateToProps, {setRepoEnabled})(Home)
