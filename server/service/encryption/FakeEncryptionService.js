/**
 * Fake encryption service used for testing
 */
export default class FakeEncryptionService {

  encrypt(string) {
    return Promise.resolve('::' + string.split('').reverse().join(''))
  }

  decrypt(string) {
    if(!string)
      return Promise.resolve(string)
    if (string.substring(0,2) !== '::') {
      throw new Error('cannot decrypt')
    }
    return Promise.resolve(string.substring(2).split('').reverse().join(''))
  }
}
