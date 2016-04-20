import requestFn from 'request'

export function request(...args) {
  return new Promise((resolve, reject) => {
    requestFn(...args, (err, ...rest) => {
      if (err) {
        reject(err)
      } else {
        resolve(rest)
      }
    })
  })
}

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

export function getIn(obj, path, returnDefault = null) {
  if (!obj || !path || !Array.isArray(path)) {
    return returnDefault
  }
  const [head, ...tail] = path
  if (obj.hasOwnProperty(head)) {
    return tail.length === 0 ?
              obj[head] :
              getIn(obj[head], tail, returnDefault)
  }
  return returnDefault
}
