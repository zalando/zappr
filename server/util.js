import glob from 'glob'
import path from 'path'
import { config } from './config'

/**
 * Optional monoid.
 *
 * @param v A value
 * @returns {Function}
 */
export function optional(v) {
  return (attr, dflt) => {
    if (!attr) return v
    if (dflt && v) return v[attr] || dflt
    if (dflt) return dflt
    if (v) return optional(v[attr])
    else return optional()
  }
}

function find(pattern) {
  return new Promise((resolve, reject) =>
    glob(pattern, (err, result) =>
      err ? reject(err) : resolve(result.map(f => path.basename(f)))
    )
  )
}

/**
 * Yield assets from the static dir.
 *
 * @returns {Promise.<object>}
 */
export function getAssets() {
  const dir = config.get('STATIC_DIR')

  return Promise.all([
    find(path.join(dir, '*.js')),
    find(path.join(dir, '*.css'))
  ]).
  then(assets => ({
    js: assets[0],
    css: assets[1]
  }))
}
