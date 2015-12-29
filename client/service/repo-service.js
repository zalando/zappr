import fetch from 'isomorphic-fetch'

export default class RepoService {
  static fetchAll() {
    return fetch('/api/repos', {
      credentials: 'same-origin'
    }).
    then(response => response.json())
  }

  static updateOne(repo) {
    return fetch(`/api/repos/${repo.id}`, {
      method: 'PUT',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(repo),
      credentials: 'same-origin'
    }).
    then(response => response.json())
  }
}
