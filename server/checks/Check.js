export function getPayloadFn(context) {
  return function createStatePayload(description, state = 'success') {
    return {
      state,
      context,
      description
    }
  }
}


export default class Check {
  /**
   * @param {string} event
   * @returns {boolean}
   */
  static isTriggeredBy(event) {
    return this.HOOK_EVENTS.indexOf(event) !== -1
  }
}
