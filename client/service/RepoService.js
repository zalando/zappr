import fetch from 'isomorphic-fetch'
import Service from './Service'

export default class RepoService extends Service {
  static verifyConfig(repoId) {
    return fetch(Service.url(`/api/repos/${repoId}/verify`), {credentials: 'same-origin'})
    .then(response => {
      return new Promise((resolve, reject) => {
        response.json().then(({message}) => {
          if (response.ok) {
            return resolve(message)
          }
          return reject(message)
        })
      })
    })
  }

  static fetchAll(loadAllFromUpstream) {
    return fetch(Service.url(`/api/repos${loadAllFromUpstream ? '?all=true' : ''}`), {
      credentials: 'same-origin'
    }).then(response => {
      return new Promise((resolve, reject) => {
        if (response.ok) {
          return response.json().then(resolve)
        }
        response.text().then(reject)
      })
    })
  }
}
