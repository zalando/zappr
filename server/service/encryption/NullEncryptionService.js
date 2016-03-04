export default class NullEncryptionService  {

  encrypt(string) {
    return Promise.resolve(string)
  }

  decrypt(string) {
    return Promise.resolve(string)
  }
}
