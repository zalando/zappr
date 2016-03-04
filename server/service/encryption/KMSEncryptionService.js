import aws from 'aws-sdk'
import { logger } from '../../../common/debug'

const debug = logger('kms')
const error = logger('kms', 'error')

export default class KMSEncryptionService {
    constructor(keyId, region = 'eu-west-1') {
        this.keyId = keyId
        this.kms = new aws.KMS({
            region: region,
            apiVersion: '2014-11-01'
        })
    }

    encrypt(plaintext) {
        return new Promise((resolve, reject) => {
            this.kms.encrypt({ KeyId: this.keyId, Plaintext: plaintext}, (err, data) => {
                if (err) {
                    error(err)
                    return reject(err)
                }
                debug('encrypted something')
                resolve(new Buffer(data.CiphertextBlob).toString('base64'))
            })
        })
    }

    decrypt(cipher) {
        // decode base64
        const blob = new Buffer(cipher, 'base64')
        return new Promise((resolve, reject) => {
            this.kms.decrypt({CiphertextBlob: blob}, (err, data) => {
                if (err) {
                    error(err)
                    return reject(err)
                }
                debug('decrypted something')
                resolve(new Buffer(data.Plaintext).toString('utf8'))
            })
        })
    }
}