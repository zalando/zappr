import React from 'react'
import ReactDOMServer from 'react-dom/server'

import Root from '../../client/containers/root.jsx'

export default class Index extends React.Component {
  static propTypes = {
    js: React.PropTypes.array.isRequired,
    css: React.PropTypes.array.isRequired
  }

  render() {
    const {js, css, ...other} = this.props
    return (
      <html lang="en">
      <head>
        <meta charset="utf-8"/>
        <meta http-equiv="x-ua-compatible" content="ie=edge"/>
        <meta name="description" content="Approvals for Github pull requests"/>
        <meta name="viewport" content="width=device-width,initial-scale=1"/>
        <title>ZAPPR</title>
        {css.map((s, i) => (<link key={i} href={`/${s}`} rel="stylesheet"/>))}
      </head>
      <body>
      <main id="main" dangerouslySetInnerHTML={{
            __html: ReactDOMServer.renderToString(<Root {...other}/>)
          }}/>
      {js.map((s, i) => (<script key={i} src={`/${s}`} defer={true}/>))}
      </body>
      </html>
    )
  }
}
