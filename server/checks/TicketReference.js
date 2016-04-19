import Check from './Check'
import { logger } from '../../common/debug'
import * as EVENTS from '../model/GithubEvents'

const CHECK_NAME = 'ticket-ref'
const info = logger(CHECK_NAME, 'info')
const error = logger(CHECK_NAME, 'error')

export default class TicketReference extends Check {
  static TYPE = CHECK_NAME;
  static NAME = 'Ticket reference check';
  static HOOK_EVENTS = [EVENTS.PULL_REQUEST];

  static async execute(github, config, hookPayload, token) {

  }
}