export default class Check {
  /**
   * @param {string} event
   * @returns {boolean}
   */
  static isEvent(event) {
    return this.hookEvents.indexOf(event) !== -1
  }
}
