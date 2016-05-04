import React from 'react'
import { createRenderer } from 'react-addons-test-utils'
import { expect } from 'chai'

import RepositoryList from '../../client/components/RepositoryList.jsx'
import { unit } from '../utils'

describe('RepositoryList', () => {

  const fixtures = {
    repositories: {
      'zappr/aaa': {
        full_name: 'zappr/aaa'
      },
      'zappr/CCC': {
        full_name: 'zappr/CCC'
      },
      'zappr/bbb': {
        full_name: 'zappr/bbb'
      },
      'xappr/DDD': {
        full_name: 'xappr/DDD'
      }
    }
  }

  function renderRepositoryList(repositories, filterBy = '') {
    const props = {
      filterBy,
      repositories,
      selected: '',
      isUpdating: false,
      filterRepos: unit,
      fetchAll: unit
    }
    const shallowRenderer = createRenderer()
    shallowRenderer.render(<RepositoryList {...props}/>)
    return shallowRenderer.getRenderOutput()
  }

  it('should render sorted repositories', () => {
    const repositoryList = renderRepositoryList(fixtures.repositories)
    const listGroup = repositoryList.props.children.find(e => e.props.componentClass === 'ul')
    const actual = listGroup.props.children.map(child => child.props.repository.full_name)
    const expected = ['xappr/DDD','zappr/aaa','zappr/bbb','zappr/CCC']

    expect(actual).to.deep.equal(expected)
  })

  it('should render filtered repositories', () => {
    const filterBy = 'xappr'
    const repositoryList = renderRepositoryList(fixtures.repositories, filterBy)
    const listGroup = repositoryList.props.children.find(e => e.props.componentClass === 'ul')
    const actual = listGroup.props.children.map(child => child.props.repository)
    const expected = [fixtures.repositories['xappr/DDD']]

    expect(actual).to.deep.equal(expected)
  })
})
