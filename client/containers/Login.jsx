import React, { Component, PropTypes } from 'react'
import { connect } from 'react-redux'
import { Link } from 'react-router'
import { Grid, Row, Col, Image, Navbar } from 'react-bootstrap'
import { loginGithub } from '../actions/auth'
import { logger } from '../../common/debug'
import logo from '../img/logo.svg'
const log = logger('login')

function mapStateToProps(state) {
  return {
    isAuthenticated: state.auth.isAuthenticated,
    isAuthenticating: state.auth.isAuthenticating
  }
}

const YELLOW = '#F6C341'

function CommitMessage({animate}) {
  return <svg id="commitmessage" width={300} height={200}>
    <g transform="translate(-50, -50)">
      <path id="commitmessage_branch"
            d="m89.5,97c0,78 18,115 100.5,111"
            fillOpacity="null"
            className={animate ? 'grow' : ''}
            strokeOpacity="null"
            strokeDasharray="200"
            strokeDashoffset="200"
            strokeWidth="2"
            stroke="#000"
            fill="none"/>
      <line strokeLinecap="null"
            strokeLinejoin="null"
            id="svg_6"
            y2="94"
            x2="190.5"
            y1="94"
            x1="76.5"
            fillOpacity="null"
            strokeOpacity="null"
            strokeWidth="2"
            stroke="#000"
            fill="none"/>
      <ellipse ry="25"
               rx="25"
               id="svg_1"
               cy="92.5"
               cx="89.5"
               strokeWidth="2"
               stroke="#000"
               fill="#fff"/>
      <ellipse ry="25"
               rx="25"
               id="svg_2"
               cy="92.5"
               cx="89.5"
               strokeWidth="2"
               stroke="#000"
               fill="#fff"/>
      <ellipse ry="25"
               rx="25"
               id="svg_4"
               cy="92.5"
               cx="190.506577"
               strokeWidth="2"
               stroke="#000"
               fill="#fff"/>
      <ellipse stroke="#fff"
               className={animate ? 'grow' : ''}
               ry="25"
               rx="25"
               id="commitmessage_commit"
               cy="205.5"
               cx="191.5"
               strokeWidth="4"
               fill="#fff"/>
    </g>
  </svg>
}

function Approval({animate}) {
  return <svg id="approval" width={300} height={200}>
    <g transform="translate(-50, -50)">
      <path id="approval_merge"
            d="m199.5,209c102,1 102,-27 95,-116"
            fillOpacity="null"
            className={animate ? 'grow' : ''}
            strokeOpacity="null"
            strokeDasharray="200"
            strokeDashoffset="200"
            strokeWidth="4"
            stroke={YELLOW}
            fill="#fff"/>
      <path id="approval_branch"
            className={animate ? 'grow' : ''}
            d="m89.5,97c0,78 18,115 100.5,111"
            strokeDasharray="200"
            strokeDashoffset="200"
            strokeOpacity="null"
            strokeWidth="2"
            stroke="#000"
            fill="none"/>
      <line strokeLinecap="null"
            strokeLinejoin="null"
            y2="94"
            x2="190.5"
            y1="94"
            x1="76.5"
            fillOpacity="null"
            strokeOpacity="null"
            strokeWidth="2"
            stroke="#000"
            fill="none"/>
      <line strokeLinecap="null"
            strokeLinejoin="null"
            strokeDasharray="200"
            strokeDashoffset="200"
            id="approval_master"
            className={animate ? 'grow' : ''}
            y2="94"
            x2="304.5"
            y1="94"
            x1="190.5"
            fillOpacity="null"
            strokeOpacity="null"
            strokeWidth="2"
            stroke="#000"
            fill="none"/>
      <ellipse ry="25"
               rx="25"
               id="svg_1"
               cy="92.5"
               cx="89.5"
               strokeWidth="2"
               stroke="#000"
               fill="#fff"/>
      <ellipse ry="25"
               rx="25"
               id="svg_2"
               cy="92.5"
               cx="89.5"
               strokeWidth="2"
               stroke="#000"
               fill="#fff"/>
      <ellipse ry="25"
               rx="25"
               id="svg_4"
               cy="92.5"
               cx="190.506577"
               strokeWidth="2"
               stroke="#000"
               fill="#fff"/>
      <ellipse ry="10"
               rx="10"
               id="approval_mastercommit"
               className={animate ? 'grow' : ''}
               cy="92.5"
               cx="291.5"
               strokeWidth="2"
               stroke="#000"
               fill="#fff"/>
      <ellipse stroke="#000"
               className={animate ? 'grow' : ''}
               ry="10"
               rx="10"
               id="approval_commit"
               cy="205.5"
               cx="191.5"
               strokeWidth="2"
               fill="#fff"/>
    </g>
  </svg>
}

function Autobranch({animate}) {
  return <svg id="autobranch" width={300} height={200}>
    <g transform="translate(-50, -50)">
      <path id="autobranch_branch"
            className={animate ? 'grow' : ''}
            d="m89.5,97c0,78 18,115 100.5,111"
            fillOpacity="null"
            strokeDasharray="200"
            strokeDashoffset="200"
            strokeOpacity="null"
            strokeWidth="4"
            stroke={YELLOW}
            fill="none"/>
      <line strokeLinecap="null"
            strokeLinejoin="null"
            id="svg_6"
            y2="94"
            x2="190.5"
            y1="94"
            x1="76.5"
            fillOpacity="null"
            strokeOpacity="null"
            strokeWidth="2"
            stroke="#000"
            fill="none"/>
      <ellipse ry="25"
               rx="25"
               id="svg_1"
               cy="92.5"
               cx="89.5"
               strokeWidth="2"
               stroke="#000"
               fill="#fff"/>
      <ellipse ry="25"
               rx="25"
               id="svg_2"
               cy="92.5"
               cx="89.5"
               strokeWidth="2"
               stroke="#000"
               fill="#fff"/>
      <ellipse ry="25"
               rx="25"
               id="svg_4"
               cy="92.5"
               cx="190.506577"
               strokeWidth="2"
               stroke="#000"
               fill="#fff"/>
      <ellipse stroke="#000"
               className={animate ? 'grow' : ''}
               ry="10"
               rx="10"
               id="autobranch_commit"
               cy="205.5"
               cx="191.5"
               strokeWidth="2"
               fill="#fff"/>
    </g>
  </svg>
}

function Highlight({children}) {
  return <span style={{backgroundImage: `linear-gradient( to top, rgba(0,0,0,0) 2%, ${YELLOW} 2%, ${YELLOW} 10%, rgba(0,0,0,0) 8%);`}}>{children}</span>;
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
    if (this.props.isAuthenticated) {
      this.context.router.replace('/')
    }
  }

  render() {
    const loginButton = <a type='button'
                           className='btn btn-social btn-github'
                           disabled={this.props.isAuthenticating}
                           href='/auth/github'
                           onClick={this.props.loginGithub}>
      <span className='fa fa-github'/>
      Sign in with GitHub
    </a>

    return (
      <section className='zpr-login'>
        <div style={{flex: '1 1 auto', width: '100%'}}>
          <div className="page-header text-center">

            <h2 className="hero">
              <img src={logo} className="logo"/> Zappr is a <Highlight>Github</Highlight> integration
            </h2>
            <div style={{margin: '30 0'}}>
              {loginButton}
            </div>
          </div>
        </div>

        <Grid type="fluid" style={{marginTop: '1em'}}>
          <Row>
            <Col md={4}>
              <section>
                <h4>Pull Request <Highlight>approvals</Highlight></h4>
                <p><Highlight>Block pull requests</Highlight> until maintainers approved all proposed changes.</p>
                <Approval animate={this.state.animate}/>
              </section>
            </Col>
            <Col md={4}>
              <section>
                <h4>Commit message patterns</h4>
                <p>Require commit messages in a pull request to <Highlight>follow a pattern you define.</Highlight></p>
                <CommitMessage animate={this.state.animate}/>
              </section>
            </Col>
            <Col md={4}>
              <section>
                <h4>Automatic branch creation</h4>
                <p>Automatically create a branch in your repository <Highlight>for every opened issue.</Highlight></p>
                <Autobranch animate={this.state.animate}/>
              </section>
            </Col>
          </Row>
          <Row>
            <Col md={12}>
              <h2 className="page-header text-center">Benefits</h2>
            </Col>
            <Col md={4}>
              <section>
                <h4 className="text-center">Code Review</h4>
                <p>Zappr is our attempt to <Highlight>restore and improve code review</Highlight> to the process of
                  developing a project on
                  Github. Github doesn't impose restrictions on project contributions. While great for openness, this
                  can pose challenges for project developers who want contributors to follow certain guidelines.</p>
              </section>
            </Col>
            <Col md={4}>
              <section>
                <h4 className="text-center">Compliance</h4>
                <p>We are proponents of being able to do as much work as possible in Github, using Github. When working
                  with compliance requirements, however, this can get tricky: <Highlight>how can developers employ the
                    four-eyes
                    principle on Github?</Highlight> Zappr aims to address this by applying a review/approval function
                  to the project
                  workflow at a critical point of transition.</p>
              </section>
            </Col>
            <Col md={4}>
              <section>
                <h4 className="text-center">No More Bottlenecks</h4>
                <p>We think it could be very useful for larger open-source projects that can't rely on a handful of
                  admins to handle all PRs <Highlight>without sacrificing quality control.</Highlight></p>
              </section>
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
