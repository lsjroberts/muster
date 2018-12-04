import { batchRequestsMiddleware, NodeDefinition, proxy } from '@dws/muster';
import { workerMiddleware } from './worker-middleware';

/**
 * Options for Worker Hosting
 */
export interface WorkerOptions {
  /**
   * Log interactions to the console (debug)
   */
  log?: boolean;
}

/**
 * Create a host for a Worker graph
 * @param path - the path or url to the deployed Worker script
 * @param [options] - configuration options
 */
export function worker(path: string, options: WorkerOptions = {}): NodeDefinition {
  return proxy([
    batchRequestsMiddleware(),
    workerMiddleware({
      ...options,
      path,
    }),
  ]);
}
