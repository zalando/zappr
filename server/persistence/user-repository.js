import Repository from './repository'

const NAME = 'ZAPPR_USER'

export default class UserRepository extends Repository {
  constructor() {
    super(NAME)
  }
}
