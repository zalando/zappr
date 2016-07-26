import React, { Component, PropTypes } from 'react'
import { connect } from 'react-redux'
import { Link } from 'react-router'
import { Grid, Row, Col, Image, Navbar } from 'react-bootstrap'
import { loginGithub } from '../actions/auth'
import Approval from './../components/ApprovalAnimation.jsx'
import Autobranch from './../components/AutobranchAnimation.jsx'
import CommitMessage from './../components/CommitMessageAnimation.jsx'
import { logger } from '../../common/debug'
import mascot from '../img/banner_small.png';
const log = logger('login')
const PRIMARY_COLOR = '#F6C341'

function mapStateToProps(state) {
  return {
    isAuthenticated: state.auth.isAuthenticated,
    isAuthenticating: state.auth.isAuthenticating
  }
}

function Highlight({children}) {
  return <span
    style={{backgroundImage: `linear-gradient( to top, rgba(0,0,0,0) 2%, ${PRIMARY_COLOR} 2%, ${PRIMARY_COLOR} 10%, rgba(0,0,0,0) 8%)`}}>{children}</span>;
}

class Login extends Component {
  constructor() {
    super()
    this.state = {
      animate: false
    }
  }

  static propTypes = {
    isAuthenticated: PropTypes.bool,
    isAuthenticating: PropTypes.bool
  };

  static contextTypes = {
    router: React.PropTypes.object.isRequired
  };

  componentDidMount() {
    log('componentDidMount', this.props)
    setTimeout(() => this.setState({
      animate: true
    }), 1000)
  }

  render() {

    const animationProps = {
      width: 300,
      height: 200,
      animate: this.state.animate,
      primaryColor: PRIMARY_COLOR
    }

    return (
      <section className='zpr-login'>
        <Grid>
          <Row>
            <Col sm={6} smPush={6}>
              <h1 className="hero">
                Zappr is a <Highlight>GitHub</Highlight> integration
              </h1>
              <p className="lead">
                An agent that enforces guidelines for your GitHub repositories. It automatically checks pull requests
                before they are merged.
              </p>
              <a type='button'
                 href="/auth/github"
                 className='btn btn-social btn-github btn-lg'
                 disabled={this.props.isAuthenticating}
                 onClick={this.props.loginGithub}>
                <span className='fa fa-github'/>
                Sign in with Github
              </a>
            </Col>
            <Col sm={6} smPull={6}>
              <div className="mascot-container">
                <img src={mascot}/>
              </div>
            </Col>
          </Row>
        </Grid>

        <Grid type="fluid" style={{marginTop: '1em'}}>
          <Row>
            <Col sm={12}>
              <h2 id="features" className="page-header text-center">Features</h2>
            </Col>
            <Col sm={4}>
              <h4>Pull Request approvals</h4>
              <p><Highlight>Block pull requests</Highlight> until maintainers approved all proposed changes.</p>
              <Approval {...animationProps} />
            </Col>
            <Col sm={4}>
              <h4>Commit message patterns</h4>
              <p>Require commit messages in a pull request to <Highlight>follow a pattern you define.</Highlight></p>
              <CommitMessage {...animationProps} />
            </Col>
            <Col sm={4}>
              <h4>Automatic branch creation</h4>
              <p>Automatically create a branch in your repository <Highlight>for every opened issue.</Highlight></p>
              <Autobranch {...animationProps} />
            </Col>
          </Row>
          <Row>
            <Col sm={12}>
              <h2 id="benefits" className="page-header text-center">Benefits</h2>
            </Col>
            <Col sm={4}>
              <h4>Code Review</h4>
              <p>Zappr is our attempt to <Highlight>restore and improve code review</Highlight> to the process of
                developing a project on
                GitHub. GitHub doesn't impose restrictions on project contributions. While great for openness, this
                can pose challenges for project developers who want contributors to follow certain guidelines.</p>
            </Col>
            <Col sm={4}>
              <h4>Compliance</h4>
              <p>We are proponents of being able to do as much work as possible in GitHub, using GitHub. When working
                with compliance requirements, however, this can get tricky: <Highlight>how can developers employ the
                  four-eyes
                  principle on GitHub?</Highlight> Zappr aims to address this by applying a review/approval function
                to the project
                workflow at a critical point of transition.</p>
            </Col>
            <Col sm={4}>
              <h4>No More Bottlenecks</h4>
              <p>We think it could be very useful for larger open-source projects that can't rely on a handful of
                admins to handle all PRs <Highlight>without sacrificing quality control.</Highlight></p>
            </Col>
          </Row>
          <Row>
            <Col sm={12}>
              <h2 className="text-center page-header" id="gettingstarted">Getting started</h2>
            </Col>
            <Col sm={4} smOffset={2}>
              <h4>Setup</h4>
              <p>It's easy:</p>
              <ol>
                <li>Sign in with your <Highlight>GitHub</Highlight> account</li>
                <li>Select your repository</li>
                <li><Highlight>Enable the checks</Highlight> you want to use</li>
                <li>Optionally <Highlight>refine</Highlight> your configuration via a <code>.zappr.yaml</code>.</li>
              </ol>
              <p>
                <a href="https://zappr.readthedocs.io/en/latest/setup/">Here</a> you can find more information about
                these steps.
              </p>
            </Col>
            <Col sm={4}>
              <h4>Comparison to similar solutions</h4>
              <p>
                Zappr's biggest adantages:
              </p>
              <ul>
                <li>it's <Highlight>free</Highlight> as in beer and freedom</li>
                <li>it works only with GitHub, <Highlight>no custom UI</Highlight> needed</li>
                <li>it offers <Highlight>features beyond code review</Highlight></li>
              </ul>
              <p>Read a more detailed comparison <a href="https://zappr.readthedocs.io/en/latest/competitors/">here</a>.
              </p>
            </Col>
          </Row>
        </Grid>
        <footer>
          Made with ♥︎ by <a href='https://zalando.com'>Zalando</a>.<br/>
          <a href='https://tech.zalando.com'>Zalando Tech</a> is <a href='https://tech.zalando.com/jobs'>hiring</a>!
        </footer>
      </section>
    )
  }
}

export default connect(mapStateToProps, {loginGithub})(Login)
