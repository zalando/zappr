import { User } from '../model'
import { logger } from "../../common/debug"

const info = logger('user-handler', 'info')
const debug = logger('user-handler')

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
