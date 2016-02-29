import Approval from './Approval'

let CHECKS = {}
CHECKS[Approval.type] = Approval

export const TYPES = Object.keys(CHECKS)

function getCheckByType(type) {
    return CHECKS[type]
}

export {
    Approval,
    getCheckByType
}

