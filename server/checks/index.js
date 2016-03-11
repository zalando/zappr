import Approval from './Approval'
import Autobranch from './Autobranch'

let CHECKS = {}
CHECKS[Approval.type] = Approval
CHECKS[Autobranch.type] = Autobranch

export const TYPES = Object.keys(CHECKS)

function getCheckByType(type) {
    return CHECKS[type]
}

export {
    Approval,
    Autobranch,
    getCheckByType
}

