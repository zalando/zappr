import React from 'react'
import { Row, Col, Button } from 'react-bootstrap'

import Repo from './repo.jsx'
import Optional from './optional.jsx'
import NavHeaderComponent from './NavHeaderComponent.jsx'

export default class Home extends NavHeaderComponent {
  static propTypes = {
    githubRepos: React.PropTypes.object.isRequired,
    onRepoToggle: React.PropTypes.func.isRequired
  };

  renderMe() {
    const style = {
      spinner: {padding: '100px', color: '#663931'}
    }
    const { repos, isFetching } = this.props.githubRepos
    const onRepoToggle = this.props.onRepoToggle

    return (
      <Row className="zpr-home">
        <Col md={8} mdPush={2}>
          <Optional if={isFetching}>
            <div className="text-center" style={style.spinner}>
              <i className="fa fa-circle-o-notch fa-spin fa-5x"/>
            </div>
          </Optional>
          {repos.map((repo, i) => (
            <Repo key={i} repo={repo} onToggle={(isActive) => onRepoToggle(repo.id, isActive)}/>
          ))}
        </Col>
      </Row>
    )
  }
}
