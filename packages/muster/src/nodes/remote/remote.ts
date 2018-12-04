import { FLUSH } from '../../events';
import { NodeDefinition, NodeTypeMap } from '../../types/graph';
import { batchRequestsMiddleware } from './middlewares/batch-requests-middleware';
import { xhrMiddleware } from './middlewares/xhr-middleware';
import { proxy } from './proxy';
import { onGlobalEvent } from './schedulers/on-global-event';
import { SchedulerFactory } from './schedulers/types';

export interface RemoteOptions {
  headers?: NodeDefinition;
  log?: boolean;
  middleware?: Array<NodeDefinition>;
  nodeTypes?: NodeTypeMap;
  numberOfRetries?: number;
  requestTimeout?: number;
  retryDelay?: number;
  scheduler?: SchedulerFactory;
  withCredentials?: boolean;
}

export function remote(url: string, options?: RemoteOptions): NodeDefinition {
  return proxy(
    [
      ...((options && options.middleware && options.middleware) || []),
      batchRequestsMiddleware(),
      xhrMiddleware({
        headers: options && options.headers,
        log: options && options.log,
        nodeTypes: options && options.nodeTypes,
        numberOfRetries: options && options.numberOfRetries,
        requestTimeout: options && options.requestTimeout,
        retryDelay: options && options.retryDelay,
        url,
        withCredentials: options && options.withCredentials,
      }),
    ],
    {
      scheduler: options && options.scheduler ? options.scheduler : onGlobalEvent(FLUSH),
    },
  );
}
