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
