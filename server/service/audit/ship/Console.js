import { logger } from '../../../../common/debug'

const info = logger('audit', 'info')

export default function() {
  return function(data) {
    info(JSON.stringify(data))
  }
}
