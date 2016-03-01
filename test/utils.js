export function doTimeout(delay = 0, fn = () => null) {
  return new Promise((resolve, reject) =>
    setTimeout(() => {
      try {
        return resolve(fn())
      }
      catch (e) {
        return reject(e)
      }
    }, delay)
  )
}
