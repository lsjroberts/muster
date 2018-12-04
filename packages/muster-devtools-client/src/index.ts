import { ContextId, ScopeId, SerializedStore } from '@dws/muster';

export * from './client-commands';
export * from './command-runner';
export * from './devtools-commands';
export * from './remote-middlewares';
export * from './with-dev-tools';

export enum MiddlewareRequestStatus {
  Pending,
  Open,
  Closed,
}

export interface StoreMetadata {
  scope: ScopeId;
  context: ContextId;
  cache: SerializedStore['cache'];
  subscriptions: SerializedStore['subscriptions'];
  nodeTypes: SerializedStore['nodeTypes'];
}
