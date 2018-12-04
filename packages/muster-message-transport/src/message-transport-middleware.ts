import {
  createNodeDefinition,
  createNodeType,
  deserialize,
  getMusterNodeTypesMap,
  getMusterOperationTypesMap,
  graphTypes,
  NodeDefinition,
  NodeExecutionContext,
  NodeState,
  pending,
  RequestOperation,
  sanitize,
  StatefulGraphNode,
  StatefulNodeDefinition,
  StatefulNodeType,
  types,
} from '@dws/muster';
import omit from 'lodash/omit';
import { DisposeListener, Message, TransportOptions } from '.';
import {
  subscribe,
  SubscriptionResultMessage,
  SubscriptionResultMessageName,
  unsubscribe,
} from './messages';

const DEFAULT_SANITIZER = sanitize;

export interface MessageTransportMiddlewareNode
  extends StatefulGraphNode<
      'message-transport-middleware',
      MessageTransportMiddlewareNodeProperties,
      MessageTransportMiddlewareState,
      MessageTransportMiddlewareData
    > {}

export interface MessageTransportMiddlewareNodeDefinition
  extends StatefulNodeDefinition<
      'message-transport-middleware',
      MessageTransportMiddlewareNodeProperties,
      MessageTransportMiddlewareState,
      MessageTransportMiddlewareData
    > {}

export interface MessageTransportMiddlewareNodeProperties {
  listen: TransportOptions['listen'];
  send: TransportOptions['send'];
  sanitize: TransportOptions['sanitize'];
}

export interface MessageTransportMiddlewareState extends NodeState {
  result: {
    [requestId: string]: NodeDefinition | undefined;
  };
}

export interface MessageTransportMiddlewareData {
  subscriptions: {
    [requestId: string]: DisposeListener | undefined;
  };
}

export const MessageTransportMiddlewareNodeType: StatefulNodeType<
  'message-transport-middleware',
  MessageTransportMiddlewareNodeProperties,
  MessageTransportMiddlewareState,
  MessageTransportMiddlewareData
> = createNodeType<
  'message-transport-middleware',
  MessageTransportMiddlewareNodeProperties,
  MessageTransportMiddlewareState,
  MessageTransportMiddlewareData
>('message-transport-middleware', {
  shape: {
    listen: types.func,
    send: types.func,
    sanitize: types.optional(types.func),
  },
  state: {
    result: types.objectOf(graphTypes.nodeDefinition),
  },
  getInitialState() {
    return {
      result: {},
    };
  },
  operations: {
    request: {
      run(
        node: MessageTransportMiddlewareNode,
        operation: RequestOperation,
        dependencies: never,
        contextDependencies: never,
        state: MessageTransportMiddlewareState,
      ): NodeDefinition {
        return state.result[operation.id] || pending();
      },
      onSubscribe(
        this: NodeExecutionContext<MessageTransportMiddlewareState, MessageTransportMiddlewareData>,
        node: MessageTransportMiddlewareNode,
        operation: RequestOperation,
      ): void {
        const { listen, send, sanitize = DEFAULT_SANITIZER } = node.definition.properties;
        const requestId = operation.id;
        const callback = (message: Message<any>) => {
          // Check the type of message
          if (
            !message ||
            (typeof message === 'object' && message.name !== SubscriptionResultMessageName)
          ) {
            return;
          }
          const subscriptionResultMessage = message as SubscriptionResultMessage;
          // Make sure the response is for the correct request
          if (subscriptionResultMessage.requestId !== requestId) return;
          const response = deserialize(
            getMusterNodeTypesMap(),
            getMusterOperationTypesMap(),
            subscriptionResultMessage.response,
          );
          this.setState((state) => ({
            ...state,
            result: {
              ...state.result,
              [requestId]: response,
            },
          }));
        };
        this.setData((data) => ({
          ...data,
          subscriptions: {
            ...data.subscriptions,
            [requestId]: listen(callback),
          },
        }));
        const serializedQuery = sanitize(operation.properties.query);
        send(subscribe(requestId, serializedQuery));
      },
      onUnsubscribe(
        this: NodeExecutionContext<MessageTransportMiddlewareState, MessageTransportMiddlewareData>,
        node: MessageTransportMiddlewareNode,
        operation: RequestOperation,
      ): void {
        const { send } = node.definition.properties;
        const requestId = operation.id;
        this.setData((data) => {
          const unsubscribeListener = data.subscriptions[requestId];
          unsubscribeListener && unsubscribeListener();
          return {
            ...data,
            subscriptions: omit(data.subscriptions, requestId),
          };
        });
        this.setState((state) => ({
          ...state,
          result: omit(state.result, requestId),
        }));
        send(unsubscribe(requestId));
      },
    },
  },
});

export function messageTransportMiddleware(
  options: TransportOptions,
): MessageTransportMiddlewareNodeDefinition {
  return createNodeDefinition(MessageTransportMiddlewareNodeType, {
    listen: options.listen,
    send: options.send,
    sanitize: options.sanitize,
  });
}
