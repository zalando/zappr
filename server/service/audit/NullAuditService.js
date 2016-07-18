import AuditService from './AuditService';

export default class NullAuditService extends AuditService {
  async ship() {
    // noop
  }

  transform() {
    // noop
  }
}
