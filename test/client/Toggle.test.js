import React from 'react'
import { Checkbox } from 'react-bootstrap'
import { createRenderer, findRenderedComponentWithType } from 'react-addons-test-utils'
import { expect } from 'chai'
import { shallow } from 'enzyme'

import Toggle from '../../client/components/Toggle.jsx'

describe('Toggle', () => {

  function renderToggle(checked, onToggle, isUpdating) {
    const toggle = shallow(<Toggle {...{checked, onToggle, isUpdating}}/>)
    const checkbox = toggle.find(Checkbox)
    return {toggle, checkbox}
  }

  it('should be unchecked when off', () => {
    const {toggle, checkbox} = renderToggle(false, () => null, false)
    expect(toggle.props()).to.have.property('className', 'toggle btn btn-default off')
    expect(checkbox.props()).to.have.property('checked', false)
    expect(checkbox.props()).to.have.property('disabled', false)
  })

  it('should be disabled when updating', () => {
    const {toggle, checkbox} = renderToggle(false, () => null, true)
    expect(toggle.props()).to.have.property('className', 'toggle btn btn-default off disabled')
    expect(checkbox.props()).to.have.property('checked', false)
    expect(checkbox.props()).to.have.property('disabled', true)
  })

  it('should be checked when on', () => {
    const {toggle, checkbox} = renderToggle(true, () => null, false)
    expect(toggle.props()).to.have.property('className', 'toggle btn btn-primary')
    expect(checkbox.props()).to.have.property('checked', true)
    expect(checkbox.props()).to.have.property('disabled', false)
  })
})
