import nconf from '../nconf'

export const schema = nconf.get('DB_SCHEMA')

/**
 * Model property getter.
 *
 * Return the 'json' value as an object.
 *
 * @returns {Object}
 */
export function deserializeJson() {
  const json = this.getDataValue('json')
  return typeof json === 'string' ? JSON.parse(json) : json
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
