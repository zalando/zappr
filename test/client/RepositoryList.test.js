import React from 'react'
import { createRenderer } from 'react-addons-test-utils'
import { expect } from 'chai'

import RepositoryList from '../../client/components/RepositoryList.jsx'

describe('RepositoryList', () => {

  const fixtures = {
    repositories: {
      'zappr/aaa': {
        full_name: 'zappr/aaa'
      },
      'zappr/ccc': {
        full_name: 'zappr/ccc'
      },
      'zappr/bbb': {
        full_name: 'zappr/bbb'
      }
    }
  }

  function renderRepositoryList(repositories, filterBy = '') {
    const props = {
      filterBy,
      repositories,
      selected: '',
      isUpdating: false,
      filterRepos: (() => null),
      fetchAll: (() => null)
    }
    const shallowRenderer = createRenderer()
    shallowRenderer.render(<RepositoryList {...props}/>)
    return shallowRenderer.getRenderOutput()
  }

  it('should render sorted repositories', () => {
    const repositoryList = renderRepositoryList(fixtures.repositories)
    const listGroup = repositoryList.props.children.find(e => e.props.componentClass === 'ul')
    const actual = listGroup.props.children.map(child => child.props.repository.full_name)
    const expected = Object.keys(fixtures.repositories).sort()

    expect(actual).to.deep.equal(expected)
  })

  it('should render filtered repositories', () => {
    const filterBy = 'zappr/aaa'
    const repositoryList = renderRepositoryList(fixtures.repositories, filterBy)
    const listGroup = repositoryList.props.children.find(e => e.props.componentClass === 'ul')
    const actual = listGroup.props.children.map(child => child.props.repository)
    const expected = [fixtures.repositories['zappr/aaa']]

    expect(actual).to.deep.equal(expected)
  })
})
