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

  async execute(options) {
    throw new Error("Override Check.execute() in subclass") // what's the appropriate vocabulary as these are not real classes?
  }
}
