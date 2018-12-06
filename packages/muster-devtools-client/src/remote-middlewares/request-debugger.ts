import {
  createNodeDefinition,
  createNodeType,
  error,
  GraphNode,
  NodeDefinition,
  NodeExecutionContext,
  RequestMetadata,
  requestOperation,
  RequestOperation,
  resolve,
  StatefulGraphNode,
  StatefulNodeDefinition,
  StatefulNodeType,
  traverse,
  types,
  withScopeFrom,
} from '@dws/muster';
import omit from 'lodash/omit';

export interface RequestDebuggerMiddlewareNode
  extends StatefulGraphNode<
      'request-debugger-middleware',
      RequestDebuggerMiddlewareNodeProperties,
      RequestDebuggerMiddlewareState,
      RequestDebuggerMiddlewareData
    > {}

export interface RequestDebuggerMiddlewareNodeDefinition
  extends StatefulNodeDefinition<
      'request-debugger-middleware',
      RequestDebuggerMiddlewareNodeProperties,
      RequestDebuggerMiddlewareState,
      RequestDebuggerMiddlewareData
    > {}

export type RequestId = number;

export interface RequestDebuggerMiddlewareState {
  requestIds: {
    [operationId: string]: RequestId;
  };
}

export interface RequestDebuggerMiddlewareData {}

export interface RequestDebuggerMiddlewareNodeProperties {
  onRequest: (query: GraphNode, metadata: RequestMetadata) => void;
  onRequestClosed: (metadata: RequestMetadata) => void;
  onResponse: (response: GraphNode, metadata: RequestMetadata) => void;
}

export const RequestDebuggerMiddlewareNodeType: StatefulNodeType<
  'request-debugger-middleware',
  RequestDebuggerMiddlewareNodeProperties,
  RequestDebuggerMiddlewareState,
  RequestDebuggerMiddlewareData
> = createNodeType('request-debugger-middleware', {
  shape: {
    onRequest: types.func,
    onRequestClosed: types.func,
    onResponse: types.func,
  },
  state: {
    requestIds: types.objectOf(types.number),
  },
  getInitialState() {
    return {
      requestIds: {},
    };
  },
  operations: {
    request: {
      run(
        node: RequestDebuggerMiddlewareNode,
        operation: RequestOperation,
        dependencies: never,
        context: never,
        state: RequestDebuggerMiddlewareState,
      ): NodeDefinition {
        const { onResponse } = node.definition.properties;
        const { metadata, next, query } = operation.properties;
        if (!next) return error('TransformResponseMiddleware cannot be used as a base middleware.');
        const requestId = getRequestDebuggerRequestId(metadata) || state.requestIds[operation.id];
        const sanitizedMetadata = attachRequestId(metadata, requestId);
        return resolve(
          [
            {
              target: withScopeFrom(
                next,
                traverse(next.definition, requestOperation(query, sanitizedMetadata)),
              ),
              allowErrors: true,
            },
          ],
          ([response]) => {
            onResponse(response, sanitizedMetadata);
            return response;
          },
        );
      },
      onSubscribe(
        this: NodeExecutionContext<RequestDebuggerMiddlewareState, RequestDebuggerMiddlewareData>,
        node: RequestDebuggerMiddlewareNode,
        operation: RequestOperation,
      ): void {
        const { onRequest } = node.definition.properties;
        const { metadata, next, query } = operation.properties;
        if (!next) return;
        let requestId = getRequestDebuggerRequestId(metadata);
        if (!requestId) {
          requestId = getNextRequestId();
          this.setState((state) => ({
            ...state,
            requestIds: {
              ...state.requestIds,
              [operation.id]: requestId!,
            },
          }));
        }
        const sanitizedMetadata = attachRequestId(metadata, requestId);
        onRequest(withScopeFrom(node, query), sanitizedMetadata);
      },
      onUnsubscribe(
        this: NodeExecutionContext<RequestDebuggerMiddlewareState, RequestDebuggerMiddlewareData>,
        node: RequestDebuggerMiddlewareNode,
        operation: RequestOperation,
      ): void {
        const { onRequestClosed } = node.definition.properties;
        const { metadata } = operation.properties;
        const state = this.getState();
        const requestId = getRequestDebuggerRequestId(metadata) || state.requestIds[operation.id];
        const sanitizedMetadata = attachRequestId(metadata, requestId);
        onRequestClosed(sanitizedMetadata);
        if (state.requestIds[operation.id] !== undefined) {
          this.setState((oldState) => ({
            ...oldState,
            requestIds: omit(oldState.requestIds, operation.id),
          }));
        }
      },
    },
  },
});

let lastRequestId = 0;
function getNextRequestId(): RequestId {
  lastRequestId += 1;
  return lastRequestId;
}

export function getRequestDebuggerRequestId(metadata: RequestMetadata): RequestId | undefined {
  return metadata && metadata.requestDebugger && metadata.requestDebugger.requestId;
}

function attachRequestId(metadata: RequestMetadata, requestId: RequestId): RequestMetadata {
  return {
    ...metadata,
    requestDebugger: {
      ...(metadata.requestDebugger || {}),
      requestId,
    },
  };
}

export interface RequestDebuggerMiddlewareOptions {
  onRequest: (query: GraphNode, metadata: RequestMetadata) => void;
  onRequestClosed: (metadata: RequestMetadata) => void;
  onResponse: (response: GraphNode, metadata: RequestMetadata) => void;
}

export function requestDebuggerMiddleware(
  options: RequestDebuggerMiddlewareOptions,
): RequestDebuggerMiddlewareNodeDefinition {
  return createNodeDefinition(RequestDebuggerMiddlewareNodeType, options);
}
