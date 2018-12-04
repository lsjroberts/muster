import { NodeDefinition } from '@dws/muster';
import { messageTransportMiddleware } from '@dws/muster-message-transport';
import noop from 'lodash/noop';

/**
 * Config options for WorkerMiddleware
 */
export interface WorkerMiddlewareOptions {
  /**
   * Path to the deployed Worker script file
   */
  path: string;
  /**
   * Log interactions to the console (debug)
   */
  log?: boolean;
}

function getWorker(workerPath: string): Worker {
  return new Worker(workerPath);
}

/**
 * Initialise a Muster Worker script and connect to it
 * @param [options] - connection options
 */
export function workerMiddleware(options: WorkerMiddlewareOptions): NodeDefinition {
  const worker = getWorker(options.path);
  const log = options.log ? console.debug : noop;
  return messageTransportMiddleware({
    listen(callback) {
      worker.addEventListener('message', onMessage);
      worker.addEventListener('error', onMessage);
      return () => {
        log('worker-middleware', 'UNSUB');
        worker.removeEventListener('message', onMessage);
        worker.removeEventListener('error', onMessage);
      };

      function onMessage(message: any): void {
        log('worker-middleware', 'MSG', message.data);
        callback(message.data);
      }
    },
    send(message) {
      if (worker) {
        log('worker-middleware', 'SEND', message);
        worker.postMessage(message);
      }
    },
  }) as any;
}
