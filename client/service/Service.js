export default class RepoService {
  /**
   * HOST_ADDR is defined by webpack.DefinePlugin.
   */
  static url(path) {
    return HOST_ADDR + path
  }
}
