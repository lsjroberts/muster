import {
  NodeDefinition,
  proxy,
  remote as xhrRemote,
  RemoteOptions as XhrRemoteOptions,
} from '@dws/muster';
import { socketMiddleware } from './socket-middleware';

/**
 * Configuration options for Remote connections
 */
export interface RemoteOptions extends XhrRemoteOptions {
  /** Whether to use a socket-based connection */
  useSockets?: boolean;
}

/**
 * Create a connection to a remote graph on a separate url
 * @param url - the target graph server's address
 * @param options - configuration options
 */
export function remote(url: string, options: RemoteOptions = {}): NodeDefinition {
  if (options.useSockets) {
    return proxy([
      socketMiddleware({
        log: options.log,
        nodeTypes: options.nodeTypes,
        numberOfRetries: options.numberOfRetries,
        requestTimeout: options.requestTimeout,
        retryDelay: options.retryDelay,
        url,
      }),
    ]);
  }

  return xhrRemote(url, options);
}
