import { TRANSACTION_END, TRANSACTION_START } from '../events';
import { Scope } from '../types/graph';
import { push } from './global-queue';

export default function withTransaction<T>(scope: Scope, fn: () => T): void {
  scope.globalEvents.emit({ type: TRANSACTION_START, payload: undefined });
  try {
    fn();
  } catch (e) {
    push(() => scope.globalEvents.emit({ type: TRANSACTION_END, payload: undefined }));
    throw e;
  }
  push(() => scope.globalEvents.emit({ type: TRANSACTION_END, payload: undefined }));
}
