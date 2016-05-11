/**
 * http://brandonokert.com/2015/08/04/TestingInReact/#WaitFor
 */
export function waitFor(test, timeLeft = 100) {
  const waitsInProgress = []
  const wait = (test, timeLeft, resolve, reject) => {
    waitsInProgress.push(setTimeout(() => {
      if (timeLeft <= 0) {
        return reject(new Error('timeout'))
      } else if (test()) {
        return resolve(null)
      } else {
        wait(test, timeLeft - 10, resolve, reject)
      }
    }, 10))
  }
  return new Promise((resolve, reject) => wait(test, timeLeft, resolve, reject))
}

/**
 * Unit or NoOp function.
 * 
 * @param {*} x
 * @returns {*} x
 */
export function unit(x) {
  return x
}
