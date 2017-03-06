import yaml from 'js-yaml'
import nconf from '../nconf'
import mergeWith from 'lodash/mergeWith'
import unset from 'lodash/unset'

const DEFAULT_CONFIG = nconf.get('ZAPPR_DEFAULT_CONFIG') || {}
const IGNORE_USER_CONFIG = nconf.get('IGNORE_USER_CONFIG') || []
const APPLY_USER_CONFIG_IF_OWNED_BY = nconf.get('APPLY_USER_CONFIG_IF_OWNED_BY') || []

function mergeCustomizerFn(objValue, srcValue) {
  if (Array.isArray(objValue) && (Array.isArray(srcValue) || typeof srcValue === 'undefined')) {
    // arrays should just be overwritten instead of awkwardly merged by index
    return srcValue
  }
}

function getEffectiveConfiguration(userConfig, repository, defaultConfig, ignorePaths, applyConfigIfOwnedBy) {
  const shouldPass = applyConfigIfOwnedBy.length > 0 && applyConfigIfOwnedBy.some(org => org === repository.json.owner.login)
  if (!shouldPass) {
    ignorePaths.forEach(path => unset(userConfig, path)) // unset mutates object ;_;
  }
  return mergeWith({}, defaultConfig, userConfig, mergeCustomizerFn)
}

export default class ZapprConfiguration {
  constructor(userConfig, repository = {}, defaultConfig = DEFAULT_CONFIG, ignorePaths = IGNORE_USER_CONFIG, applyConfigIfOwnedBy = APPLY_USER_CONFIG_IF_OWNED_BY) {
    this.yamlParseError = null
    this.configuration = Object.assign({}, defaultConfig)

    if (typeof userConfig === 'string') {
      try {
        const content = yaml.safeLoad(userConfig)
        this.configuration = getEffectiveConfiguration(content, repository, defaultConfig, ignorePaths, applyConfigIfOwnedBy)
      } catch (e) {
        this.yamlParseError = e.message
      }
    } else if (typeof userConfig === 'object' && !Array.isArray(userConfig)) {
      this.configuration = getEffectiveConfiguration(userConfig, repository, defaultConfig, ignorePaths, applyConfigIfOwnedBy)
    } else {
      throw new Error('ZapprConfiguration has to be called with a YAML String or a JSON object as first argument.')
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
