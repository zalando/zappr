import { Repository } from '../model'

export default class RepositoryService {
  /**
   * Instantiate a new Repository model.
   *
   * @param {Number} id - Id of the repository
   * @param {Number} userId - Id of the repository's owner
   * @returns {Sequelize.Instance}
   */
  static build(id, userId) {
    return Repository.build({id, userId})
  }

  /**
   * Reduce a database model into a flat object.
   *
   * @param {Sequelize.Instance} repo
   * @returns {Object}
   */
  flatten(repo) {
    if (!repo) return null
    let {json, ...rest} = repo.toJSON()
    if (typeof json === 'string') json = JSON.parse(json)
    return {...json, ...rest}
  }

  /**
   * Find one repository by id.
   *
   * @param {Number} id - Id of the repository
   * @param {Number} userId - Id of the repository's owner
   * @param {Boolean} [flatten = true] - Flatten the model
   * @returns {Promise.<(Object|Sequelize.Instance|null)>}
   */
  findOne(id, userId, flatten = true) {
    const promise = Repository.findOne({where: {id, userId}})
    if (flatten) return promise.then(this.flatten)
    else return promise
  }

  /**
   * Find all repositories of a user.
   *
   * @param {Number} userId - Id of the repositories' owner
   * @param {Boolean} [flatten = true] - Flatten the model
   * @returns {Promise.<(Object|Sequelize.Instance|null)>}
   */
  findAll(userId, flatten = true) {
    const promise = Repository.findAll({where: {userId}})
    if (flatten) return promise.then(repos => repos.map(this.flatten))
    else return promise
  }

  /**
   * Create or update one repository.
   *
   * @deprecated Use {@link Sequelize.Instance.save} instead
   * @param {Sequelize.Instance} repo
   * @param {Number} userId - Id of the repository's owner
   * @returns {Promise}
   */
  upsertOne(repo, userId) {
    return Repository.upsert({...repo.toJSON(), userId})
  }

  /**
   * Create or update many repositories.
   *
   * @deprecated Use {@link Sequelize.Instance.save} instead
   * @param {Array.<Sequelize.Instance>} repos
   * @param {Number} userId - Id of the repositories' owner
   * @returns {Promise}
   */
  upsertAll(repos, userId) {
    return Promise.all(repos.map(repo => this.upsertOne(repo, userId)))
  }
}
