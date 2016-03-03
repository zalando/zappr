import fetch from 'isomorphic-fetch'
import Service from './Service'

export default class RepoService extends Service {

  static fetchAll() {
    return fetch(Service.url('/api/repos'), {
      credentials: 'same-origin'
    }).then(response => response.json())
  }

  /**
   * @deprecated API should not support 'PUT' on whole repository. TODO: method to add 'checks'
   */
  static updateOne(repo) {
    return fetch(Service.url(`/api/repos/${repo.id}`), {
      method: 'PUT',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(repo),
      credentials: 'same-origin'
    }).then(response => response.json())
  }
}
