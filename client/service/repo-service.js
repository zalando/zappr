import fetch from 'isomorphic-fetch'

function url(path) {
  // ZAPPR_HOST is a global defined by webpack.
  return ZAPPR_HOST + path
}

export default class RepoService {
  static fetchAll() {
    return fetch(url('/api/repos'), {
      credentials: 'same-origin'
    })
    .then(response => response.json())
  }

  /**
   * @deprecated API should not support 'PUT' on whole repository. TODO: method to add 'checks'
   */
  static updateOne(repo) {
    return fetch(url(`/api/repos/${repo.id}`), {
      method: 'PUT',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(repo),
      credentials: 'same-origin'
    })
    .then(response => response.json())
  }
}
