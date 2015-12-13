import React from 'react'
import ReactDOM from 'react-dom'
import app from './components/app.jsx'

const App = React.createFactory(app)

ReactDOM.render(App(), document.getElementById('main'))
