import { User } from '../model'

export default class UserService {

  findOne(id) {
    return User.findById(id)
  }

  findAll() {
    return User.findAll().
    then(users => users.map(user => ({
      id: user.id,
      ...JSON.parse(user.get('json'))
    })))
  }

  upsertOne(user) {
    const {id, ...userData} = user
    return User.upsert({
      id,
      json: userData
    })
  }

  upsertAll(users) {
    return Promise.all(users.map(this.upsertOne))
  }
}
