export default class RepoService {
  /**
   * ZAPPR_HOST is a global defined by webpack.
   */
  static url(path) {
    return HOST_ADDR + path
  }
}
