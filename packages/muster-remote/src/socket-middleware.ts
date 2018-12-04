import { NodeDefinition, NodeTypeMap, OperationTypeMap } from '@dws/muster';
import {
  Message,
  messageTransportMiddleware,
  SubscribeMessageName,
  UnsubscribeMessageName,
} from '@dws/muster-message-transport';
import pick from 'lodash/pick';
import { default as Socket } from './socket';

/**
 * Configuration options for SocketMiddleware
 */
export interface SocketMiddlewareOptions {
  /** Whether to log activities to the console */
  log?: boolean;
  /** A map of acceptable nodeTypes */
  nodeTypes?: NodeTypeMap;
  /** How many times to retry connecting */
  numberOfRetries?: number;
  /** A map of acceptable operations */
  operationTypes?: OperationTypeMap;
  /** How long in ms to try to connect for */
  requestTimeout?: number;
  /** How long in ms to wait between retries */
  retryDelay?: number;
  /** The address of the target server */
  url: string;
}

/**
 * Create a new instance of SocketMiddleware
 * @param options - configuration options
 */
export function socketMiddleware(options: SocketMiddlewareOptions): NodeDefinition {
  const socketOptions = pick(options, ['numberOfRetries', 'retryDelay', 'requestTimeout', 'log']);
  const socket = new Socket(options.url, socketOptions);
  const openSubscriptions: Array<Message<any>> = [];
  return messageTransportMiddleware({
    listen(callback) {
      const onOpen = () => openSubscriptions.forEach((message) => socket.send(message));
      const onClose = () => callback(new Error('network connection dropped'));

      socket.addEventListener('message', callback);
      socket.addEventListener('error', callback);
      socket.addEventListener('close', onClose);
      socket.addEventListener('open', onOpen);

      socket.open();

      return () => {
        socket.removeAllEventListeners();
        socket.close(1000, 'client closed connection');
      };
    },
    send(message) {
      if (message.name === SubscribeMessageName) {
        openSubscriptions.push(message);
      } else if (message.name === UnsubscribeMessageName) {
        openSubscriptions.splice(
          openSubscriptions.findIndex((msg: any) => msg.requestId === (message as any).requestId),
          1,
        );
      }
      socket.send(message);
    },
  }) as any;
}
