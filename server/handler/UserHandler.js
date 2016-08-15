import { User } from '../model'

export class UserHandler {
  constructor() {

  }

  onGet(userId) {
    return User.findOne({id: userId})
  }

  onChangeMode(userId, zappr_mode) {
    return User.update({zappr_mode}, {where: {id: userId}})
  }
}

export default new UserHandler()
