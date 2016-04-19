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
