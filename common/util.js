/**
 * Tries to resolve one Promise after another and
 * returns a Promise with the first resolved result.
 *
 * @param {Array.<Promise>} promises
 * @returns {Promise}
 */
export function promiseFirst(promises) {
  function tryResolve([x, ...xs], resolve, reject) {
    if (xs.length > 0)
      x.then(resolve).catch(_ => tryResolve(xs, resolve, reject))
    else
      x.then(resolve).catch(reject)
  }

  return new Promise((resolve, reject) =>
    tryResolve(promises, resolve, reject)
  )
}

/**
 * Takes an array of values, a promise-returning function and an initial value.
 * Works like reduce, but is aware of async function. Returns a promise that
 * will be resolved with the final aggregator.
 *
 * @param array
 * @param fn Function to execute per value: fn(aggregator, item, index, array)
 * @param initialValue
 * @returns {*} Promise that is resolved when all values are processed
 */
export function promiseReduce(array, fn, initialValue) {
  function reduce(aggregator, index, array, resolve, reject) {
    if (index >= array.length) {
      return resolve(aggregator)
    }
    return fn(aggregator, array[index], index, array).then(newAgg => reduce(newAgg, index + 1, array, resolve, reject))
                                                     .catch(reject)
  }

  return new Promise((resolve, reject) => reduce(initialValue, 0, array, resolve, reject))
}

/**
 * Joins to parts of a URL.
 *
 * @param {string} root - http(s)://domain
 * @param {string} path - /some/path
 * @returns {string} - http(s)://domain/some/path
 */
export function joinURL(root, path) {
  return `${root.replace(/\/$/, '')}/${path.replace(/^\//, '')}`
}

/**
 * Safely gets a nested property from an object, returning
 * a default value if the provided path does not exist.
 * This is to avoid accessing undefined properties along
 * the way e.g. when calling something like `foo.bar.baz[0].quux`.
 *
 * @param obj The object to get nested properties from
 * @param path The path of properties, will be converted to an Array if it's not already
 * @param returnDefault The default value to return if the path does not exist
 * @returns {*}
 */
export function getIn(obj, path, returnDefault = null) {
  if (!obj || typeof path === 'undefined') {
    return returnDefault
  }
  if (!Array.isArray(path)) {
    path = [path]
  }
  const [head, ...tail] = path
  if (obj.hasOwnProperty(head)) {
    return tail.length === 0 ?
      obj[head] :
      getIn(obj[head], tail, returnDefault)
  }
  return returnDefault
}

export function setIn(obj, path, value) {
  if (!Array.isArray(path)) {
    path = [path]
  }
  const [head, ...tail] = path
  if (tail.length > 0) {
    // traverse deeper
    if (!obj.hasOwnProperty(head)) {
      obj[head] = {}
    }
    setIn(obj[head], tail, value)
  } else {
    // last element
    obj[head] = value
  }
  return obj
}

function findDeepInObjImpl(obj, fn, result = []) {
  if (typeof obj === 'object' && obj != null) {
    for (const key of Object.keys(obj)) {
      if (fn(key)) {
        result.push([key, obj[key]])
      }
      findDeepInObjImpl(obj[key], fn, result)
    }
  }
  return result
}

/**
 * Returns an array of [key, val] for all
 * keys in provided object where fn(key) returns true.
 *
 * @param obj object to walk
 * @param fn will be passed key. is expected to return true iff key/ should be talken.
 */
export function findDeepInObj(obj, fn) {
  return findDeepInObjImpl(obj, fn, [])
}

export function encode(string, encoding = 'base64') {
  if (encoding !== 'base64') {
    throw new Error(`Encoding "${encoding}" not supported`)
  }
  return new Buffer(string, 'utf8').toString(encoding)
}

export function decode(string, encoding = 'base64') {
  if (encoding !== 'base64') {
    throw new Error(`Encoding "${encoding}" not supported`)
  }
  return new Buffer(string, encoding).toString('utf8')
}

/**
 * Returns a new set that is the difference of the two sets provided (set1 - set2).
 *
 * @param set1
 * @param set2
 * @returns {Set} set1 - set2
 */
export function setDifference(set1, set2) {
  if (!set1 || set1.size === 0) {
    return new Set()
  }
  if (!set2 || set2.size === 0) {
    return set1
  }
  return new Set([...set1].filter(item => !set2.has(item)))
}

/**
 * Returns a union of the sets provided
 * @param sets
 * @returns {Set}
 */
export function setUnion(...sets) {
  return new Set(...sets)
}

/**
 * Returns true if the two sets are equal
 * @param set1
 * @param set2
 * @returns {boolean}
 */
export function setEquals(set1, set2) {
  const symmetricDifference = setUnion(setDifference(set1, set2), setDifference(set2, set1))
  return symmetricDifference.size === 0
}

/**
 * Returns a new set that is the intersection of two sets provided (only items that are in both)
 *
 * @param set1
 * @param set2
 * @returns {Set} intersect(set1, set2)
 */
export function setIntersection(set1, set2) {
  const symmetricDifference = setUnion(setDifference(set1, set2), setDifference(set2, set1))
  return setDifference(setUnion(set1, set2), symmetricDifference)
}

/**
 * Map over the keys and values of an object.
 *
 * @param {Object} object
 * @param {function} callback
 * @returns {Object} - new object
 */
export function mapValues(object, callback) {
  if (!object) return {}
  return Object.keys(object).reduce((newObject, key) => ({
    ...newObject, [key]: callback(key, object[key])
  }), {})
}

const ESCAPED_UNICODE_CHAR = /\\u([\d\w]{4})/gi
export function unescape(stringWithEscapedEmojis) {
  return stringWithEscapedEmojis.replace(ESCAPED_UNICODE_CHAR, (_, grp) => String.fromCharCode(parseInt(grp, 16)))
}

const SYMBOL_STRING = /Symbol\((.+?)\)/
export function symbolToString(sym) {
  if (typeof sym === 'symbol')
    return sym.toString().match(SYMBOL_STRING)[1]
  return sym
}

export function toGenericComment(githubComment) {
  const {user, ...rest} = githubComment
  return {
    ...rest,
    user: user.login
  }
}

export function toGenericReview(githubReview) {
  const {user, state, author_association} = githubReview
  return {
    user: user.login,
    state: state,
    author_association: author_association
  }
}
