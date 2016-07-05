import fetch from 'isomorphic-fetch'
import Service from './Service'

export default class RepoService extends Service {

  static fetchAll(loadAllFromUpstream) {
    return fetch(Service.url(`/api/repos${loadAllFromUpstream ? '?all=true' : ''}`), {
      credentials: 'same-origin'
    }).then(response => {
      return new Promise((resolve, reject) => {
        return response.json().then(json => {
          if (response.ok) {
            resolve(json)
          } else {
            reject(json)
          }
        })
      })
    })
  }
}
