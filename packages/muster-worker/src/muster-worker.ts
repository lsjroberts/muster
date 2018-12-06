import { Muster } from '@dws/muster';
import { Message, messageListenerDecorator } from '@dws/muster-message-transport';
import noop from 'lodash/noop';

/**
 * Configuration options for Muster Workers
 */
interface WorkerConnectConfigOptions {
  /**
   * Log interactions to the console (debug)
   */
  log?: boolean;
}

/**
 * Enable listeners for a Muster connection within a Worker scope
 * @param app - the Muster graph to connect
 * @param worker - the Worker's global context (`self`)
 * @param [config] - config options
 */
export function workerConnect(
  app: Muster,
  worker: DedicatedWorkerGlobalScope,
  config: WorkerConnectConfigOptions = {},
) {
  const log = config.log ? console.debug : noop;
  const { app: connectedApp, dispose } = messageListenerDecorator(app, {
    listen(callback) {
      log('muster-worker', 'listen');

      worker.addEventListener('message', onMessage);
      worker.addEventListener('error', onError);

      return () => {
        log('muster-worker', 'unsub');
        worker.removeEventListener('message', onMessage);
        worker.removeEventListener('error', onError);
      };

      function onMessage(event: MessageEvent) {
        log('muster-worker', 'message', event.data);
        callback(event.data);
      }

      function onError(error: ErrorEvent) {
        log('muster-worker', 'error', error);
        callback(error as any);
      }
    },
    send(message: Message<any>) {
      log('muster-worker', 'send', message);
      worker.postMessage(message);
    },
  });

  worker.addEventListener('close', dispose);

  return connectedApp;
}
