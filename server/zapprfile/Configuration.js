import yaml from 'js-yaml'
import nconf from '../nconf'
import mergeWith from 'lodash/mergeWith'

function mergeCustomizerFn(objValue, srcValue) {
  if (Array.isArray(objValue) && (Array.isArray(srcValue) || typeof srcValue === 'undefined')) {
    // arrays should just be overwritten instead of awkwardly merged by index
    return srcValue
  }
}

const DEFAULT_CONFIG = nconf.get('ZAPPR_DEFAULT_CONFIG') || {}

export default class ZapprConfiguration {
  constructor(fileContent, defaultConfig = DEFAULT_CONFIG) {
    this.yamlParseError = null
    this.configuration = Object.assign({}, defaultConfig)

    try {
      const content = yaml.safeLoad(fileContent)
      this.configuration = mergeWith({}, defaultConfig, content, mergeCustomizerFn)
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
