import { User } from '../model'

export class UserHandler {
  constructor() {

  }

  onGet(userId) {
    return User.findOne({where: {id: userId}})
  }

  onChangeLevel(userId, access_level) {
    return User.update({access_level}, {where: {id: userId}})
  }

}

export default new UserHandler()
