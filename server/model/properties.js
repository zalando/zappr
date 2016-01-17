import nconf from '../nconf'

/**
 * Model property getter.
 *
 * Return the 'json' value as an object.
 *
 * @returns {Object}
 */
export function deserializeJson(name) {
  return function () {
    const json = this.getDataValue(name)
    return typeof json === 'string' ? JSON.parse(json) : json
  }
}

/**
 * Model instance method.
 *
 * Flatten the 'json' property and the
 * other values into one plain object.
 *
 * @returns {Object}
 */
export function flattenToJson() {
  const {json, ...rest} = this.toJSON()
  return {...json, ...rest}
}
