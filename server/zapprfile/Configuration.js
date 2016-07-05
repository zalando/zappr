import yaml from 'js-yaml'
import merge from 'lodash/merge'
import nconf from '../nconf'
import {logger} from '../../common/debug'
const DEFAULT_CONFIG = nconf.get('ZAPPR_DEFAULT_CONFIG')

export default class ZapprConfiguration {
  constructor(fileContent) {
    this.yamlParseError = null
    this.configuration = Object.assign({}, DEFAULT_CONFIG)

    try {
      const content = yaml.safeLoad(fileContent)
      this.configuration = merge({}, DEFAULT_CONFIG, content)
    } catch (e) {
      this.yamlParseError = e.message
    }
  }

  isValid() {
    return this.yamlParseError === null
  }

  getParseError() {
    return this.yamlParseError
  }

  getConfiguration() {
    return this.configuration
  }
}
