export default class Check {
  /**
   * @param {string} event
   * @returns {boolean}
   */
  static isTriggeredBy(event) {
    return this.HOOK_EVENTS.indexOf(event) !== -1
  }
}
