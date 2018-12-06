import {
  deserialize,
  error,
  getMusterNodeTypesMap,
  getMusterOperationTypesMap,
  Muster,
  NodeDefinition,
  sanitize,
  SerializedNodeDefinition,
} from '@dws/muster';
import { Message, TransportOptions } from '.';
import {
  SubscribeMessage,
  SubscribeMessageName,
  subscriptionResult,
  UnsubscribeMessage,
  UnsubscribeMessageName,
} from './messages';

const DEFAULT_SANITIZER = sanitize;

type SubscriptionsMap = Map<string, () => void>;

export interface MessageListenerDecoratorResult {
  app: Muster;
  dispose: () => void;
}

export function messageListenerDecorator(
  app: Muster,
  options: TransportOptions,
): MessageListenerDecoratorResult {
  const subscriptions: SubscriptionsMap = new Map();
  const dispose = options.listen((message: Message<any>) => {
    // Check the type of message
    if (!message || typeof message !== 'object' || typeof message.name !== 'string') return;
    switch (message.name) {
      case SubscribeMessageName:
        subscribe(app, options, subscriptions, message as SubscribeMessage);
        break;
      case UnsubscribeMessageName:
        unsubscribe(subscriptions, message as UnsubscribeMessage);
        break;
    }
  });
  app.disposeCallbacks.push(dispose);
  let disposed = false;
  return {
    app,
    dispose: () => {
      if (disposed) return;
      disposed = true;
      // Make sure to close all open subscriptions
      for (const unsubscribe of subscriptions.values()) {
        unsubscribe();
      }
      // Clear the subscriptions list
      subscriptions.clear();
      // Remove the dispose callback
      app.disposeCallbacks.splice(app.disposeCallbacks.indexOf(dispose), 1);
      // And then dispose the listener
      dispose();
    },
  };
}

function subscribe(
  app: Muster,
  options: TransportOptions,
  subscriptions: SubscriptionsMap,
  message: SubscribeMessage,
): void {
  if (subscriptions.has(message.requestId)) {
    console.warn(`A request with ID ${message.requestId} already exists!`);
    return;
  }
  const sanitizeResult = options.sanitize || DEFAULT_SANITIZER;
  const requestObj = message.query;
  const requestNode = safelyDeserializeNode(requestObj);
  const subscription = app.resolve(requestNode, { raw: true }).subscribe((result) => {
    let serializedResult;
    try {
      serializedResult = sanitizeResult(result);
    } catch (e) {
      serializedResult = sanitizeResult(error(e));
    }
    options.send(subscriptionResult(message.requestId, serializedResult));
  });
  subscriptions.set(message.requestId, subscription.unsubscribe);
}

function unsubscribe(subscriptions: SubscriptionsMap, message: UnsubscribeMessage): void {
  const unsubscribe = subscriptions.get(message.requestId);
  if (!unsubscribe) return;
  unsubscribe();
  subscriptions.delete(message.requestId);
}

function safelyDeserializeNode(requestObj: SerializedNodeDefinition): NodeDefinition {
  try {
    return deserialize(getMusterNodeTypesMap(), getMusterOperationTypesMap(), requestObj);
  } catch (ex) {
    return error(ex);
  }
}
