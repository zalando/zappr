export default class NullEncryptionService  {

  async encrypt(string) {
    return Promise.resolve(string)
  }

  async decrypt(string) {
    return Promise.resolve(string)
  }
}
