import { Muster } from '@dws/muster';
import { Message, messageListenerDecorator } from '@dws/muster-message-transport';
import WebSocket from 'isomorphic-ws';
import noop from 'lodash/noop';

import { DEFAULT_WHITELISTED_NODE_TYPES, MusterExpressConfig } from './index';

const defaultConfig: MusterExpressConfig = {
  enableRequestLogging: false,
  whitelistedNodeTypes: DEFAULT_WHITELISTED_NODE_TYPES,
};

export function socketConnect(app: Muster, ws: WebSocket, config: Partial<MusterExpressConfig>) {
  const mergedConfig = { ...defaultConfig, ...config };
  const log = mergedConfig.enableRequestLogging ? console.log : noop;
  const { app: connectedApp, dispose } = messageListenerDecorator(app, {
    listen(callback) {
      const listener = createMessageListener(callback);
      ws.addListener('message', listener);
      ws.addListener('error', onError);

      return () => {
        ws.removeListener('message', listener);
        ws.removeListener('error', onError);
      };

      function onError(err: Error) {
        log(`WS:ERROR:`, err);
        callback(err);
      }
    },
    send(message: Message<any>) {
      log(`WS:SEND:`, message);
      const str = JSON.stringify(message);
      ws.send(str);
    },
  });

  ws.addListener('close', dispose);

  return connectedApp;

  function createMessageListener(callback: (msg: Message<any>) => void) {
    return (data: WebSocket.Data) => {
      log(`WS:MESSAGE:`, data);
      try {
        const json = JSON.parse(data as string);
        callback(json);
      } catch (ex) {
        log(`WS:MESSAGE:ERR:`, ex);
      }
    };
  }
}
