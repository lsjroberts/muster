import { MiddlewareRequestStatus } from '@dws/muster-devtools-client';

export function formatMiddlewareStatus(status: MiddlewareRequestStatus): string {
  switch (status) {
    case MiddlewareRequestStatus.Closed:
      return 'Closed';
    case MiddlewareRequestStatus.Open:
      return 'Open';
    case MiddlewareRequestStatus.Pending:
      return 'Pending';
    default:
      return `Unknown (${status})`;
  }
}
