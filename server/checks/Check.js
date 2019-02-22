export function getPayloadFn(context) {
  return function createStatePayload(description, state = 'success') {
    console.log('Check.js createStatePayload', state, context, description);
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
