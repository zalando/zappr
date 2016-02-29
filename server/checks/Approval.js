export default class Approval {
  static get type() {
    return 'approval'
  }

  static get hookEvents() {
    return ['pull_request', 'issue_comment']
  }

  static execute(config, hookPayload) {
    let {action, pull_request, issue} = hookPayload
    // TODO
    if (!!pull_request &&
        (action === 'opened' ||
         action === 'reopened')) {
      // check if requirements are met initially
    } else if (!!issue) {
      // check if issue belongs to a pr
      // check requiremenets
    }
  }
}
