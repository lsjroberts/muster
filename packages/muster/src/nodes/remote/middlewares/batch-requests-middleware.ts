import differenceWith from 'lodash/differenceWith';
import flatMap from 'lodash/flatMap';
import omit from 'lodash/omit';
import partition from 'lodash/partition';
import { isGetChildOperation, isGetItemsOperation } from '../../../operations';
import { resolveOperation } from '../../../operations/resolve';
import {
  GraphNode,
  GraphOperation,
  NodeDefinition,
  NodeExecutionContext,
  StatefulGraphNode,
  StatefulNodeDefinition,
  StatefulNodeType,
  UpdateCallback,
} from '../../../types/graph';
import createNodeDefinition from '../../../utils/create-node-definition';
import { createNodeType } from '../../../utils/create-node-type';
import { getInvalidTypeError } from '../../../utils/get-invalid-type-error';
import * as graphTypes from '../../../utils/graph-types';
import { DisposeCallback } from '../../../utils/store';
import * as types from '../../../utils/types';
import withScopeFrom from '../../../utils/with-scope-from';
import { array, isArrayNodeDefinition } from '../../collection/array';
import { error } from '../../graph/error';
import { isPendingNodeDefinition, pending } from '../../graph/pending';
import {
  isQuerySetNodeDefinition,
  querySet,
  QuerySetNodeDefinition,
  SerializableQuerySetChild,
} from '../../graph/query-set';
import {
  isQuerySetCallOperationNodeDefinition,
  querySetCallOperation,
  QuerySetCallOperationNodeType,
} from '../../graph/query-set-call-operation';
import {
  isQuerySetGetChildOperationNodeDefinition,
  querySetGetChildOperation,
  QuerySetGetChildOperationNodeDefinition,
  QuerySetGetChildOperationNodeType,
} from '../../graph/query-set-get-child-operation';
import {
  isQuerySetGetItemsOperationNodeDefinition,
  querySetGetItemsOperation,
  QuerySetGetItemsOperationNodeDefinition,
  QuerySetGetItemsOperationNodeType,
} from '../../graph/query-set-get-items-operation';
import {
  isQuerySetOperationNodeDefinition,
  querySetOperation,
  QuerySetOperationNodeDefinition,
  QuerySetOperationNodeType,
} from '../../graph/query-set-operation';
import {
  isQuerySetSetOperationNodeDefinition,
  querySetSetOperation,
  QuerySetSetOperationNodeType,
} from '../../graph/query-set-set-operation';
import { traverse } from '../../graph/traverse';
import { RequestMetadata, requestOperation, RequestOperation } from '../operations/request';

export interface BatchRequestsMiddlewareNode
  extends StatefulGraphNode<
      'batch-requests-middleware',
      BatchRequestsMiddlewareNodeProperties,
      BatchRequestsMiddlewareNodeState,
      BatchRequestsMiddlewareNodeData
    > {}
export interface BatchRequestsMiddlewareNodeDefinition
  extends StatefulNodeDefinition<
      'batch-requests-middleware',
      BatchRequestsMiddlewareNodeProperties,
      BatchRequestsMiddlewareNodeState,
      BatchRequestsMiddlewareNodeData
    > {}

export interface BatchRequestsMiddlewareNodeProperties {}

export interface BatchRequestsMiddlewareNodeState {
  batcherResults: {
    [rootId: string]: NodeDefinition | undefined;
  };
}

export interface BatchRequestsMiddlewareNodeData {
  batchers: Map<string, RequestBatcher>; // querySet.root.id -> RequestBatcher
}

export const BatchRequestsMiddlewareNodeType: StatefulNodeType<
  'batch-requests-middleware',
  BatchRequestsMiddlewareNodeProperties,
  BatchRequestsMiddlewareNodeState,
  BatchRequestsMiddlewareNodeData
> = createNodeType<
  'batch-requests-middleware',
  BatchRequestsMiddlewareNodeProperties,
  BatchRequestsMiddlewareNodeState,
  BatchRequestsMiddlewareNodeData
>('batch-requests-middleware', {
  shape: {},
  state: {
    batcherResults: types.objectOf(graphTypes.nodeDefinition),
  },
  getInitialState() {
    return {
      batcherResults: {},
    };
  },
  onSubscribe() {
    this.setData({
      batchers: new Map(),
    });
  },
  onUnsubscribe() {
    const { batchers } = this.getData();
    if (!batchers) return;
    for (const batcher of batchers.values()) {
      batcher.dispose();
    }
  },
  operations: {
    request: {
      run(
        node: BatchRequestsMiddlewareNode,
        operation: RequestOperation,
        dependencies: never,
        context: never,
        state: BatchRequestsMiddlewareNodeState,
      ): NodeDefinition | GraphNode {
        const { metadata, next, query } = operation.properties;
        if (!next) {
          return error('Missing `next` middleware.');
        }
        if (!isQuerySetNodeDefinition(query)) {
          return withScopeFrom(next, traverse(next.definition, requestOperation(query, metadata)));
        }
        return state.batcherResults[query.properties.root.id] || pending();
      },
      onSubscribe(
        this: NodeExecutionContext<
          BatchRequestsMiddlewareNodeState,
          BatchRequestsMiddlewareNodeData
        >,
        node: BatchRequestsMiddlewareNode,
        operation: RequestOperation,
      ): void {
        const { metadata, next, query } = operation.properties;
        // Check if the query is of a supported type or the next middleware is undefined
        if (!next || !isQuerySetNodeDefinition(query)) return;
        const batchers = this.getData().batchers!;
        const { children, root } = query.properties;
        let currentBatcher = batchers.get(root.id);
        if (!currentBatcher) {
          currentBatcher = new RequestBatcher(
            (node, operation, callback) => node.scope.store.subscribe(node, operation, callback),
            next,
            root,
            (value) => {
              this.setState((state) => ({
                ...state,
                batcherResults: {
                  ...state.batcherResults,
                  [root.id]: value,
                },
              }));
            },
          );
          batchers.set(root.id, currentBatcher);
        }
        this.setState((state) => ({
          ...state,
          batcherResults: omit(state.batcherResults, root.id),
        }));
        currentBatcher.setRequest(children as Array<SerializableQuerySetChild>, metadata);
      },
      onUnsubscribe(
        this: NodeExecutionContext<
          BatchRequestsMiddlewareNodeState,
          BatchRequestsMiddlewareNodeData
        >,
        node: BatchRequestsMiddlewareNode,
        operation: RequestOperation,
      ): void {
        const { query } = operation.properties;
        if (!isQuerySetNodeDefinition(query)) return;
        const { root } = query.properties;
        this.setState((state) => ({
          ...state,
          batcherResults: omit(state.batcherResults, root.id),
        }));
      },
    },
  },
});

export function batchRequestsMiddleware(): BatchRequestsMiddlewareNodeDefinition {
  return createNodeDefinition(BatchRequestsMiddlewareNodeType, {});
}

export type NodeDefinitionCallback = (value: NodeDefinition) => void;

export class RequestBatcher {
  private activeRequests: Array<Request> = [];
  private readonly responseBuilder: ResponseBuilder;
  private latestChildren: Array<QuerySetChildWithPath> = [];

  constructor(
    private storeSubscribe: StoreSubscribe,
    private next: GraphNode,
    private root: NodeDefinition,
    callback: NodeDefinitionCallback,
  ) {
    this.responseBuilder = new ResponseBuilder(callback);
  }

  dispose(): void {
    this.activeRequests.forEach((req) => req.dispose());
  }

  setRequest(children: Array<SerializableQuerySetChild>, metadata: RequestMetadata): void {
    // Update the combined query with the new request
    this.responseBuilder.updateQuery(children);
    // Find all children
    const allChildren = flattenQuerySetChildren(children);
    const latestChildren = this.latestChildren;
    this.latestChildren = allChildren;
    // Find all un-subscribed children
    const unsubscribedChildren = differenceWith(
      latestChildren,
      allChildren,
      compareQuerySetChildWithPath,
    );
    // Check if there are any un-subscribed paths
    if (unsubscribedChildren.length > 0) {
      // Notify the requests about un-subscriptions
      this.activeRequests.forEach((req) => {
        unsubscribedChildren.forEach((child) => {
          req.disposePath([...child.path, child.child]);
        });
      });
      // And then check which requests can be disposed
      const [requestsToDispose, remaining] = partition(this.activeRequests, (req) =>
        req.canBeDisposed(),
      );
      // Keep only the requests that can't be disposed
      this.activeRequests = remaining;
      // And dispose the rest
      requestsToDispose.forEach((req) => req.dispose());
    }
    // Find all newly subscribed paths
    const subscribedChildren = differenceWith(
      allChildren,
      latestChildren,
      compareQuerySetChildWithPath,
    );
    // Check if there are any new paths
    if (subscribedChildren.length > 0) {
      const request = new Request(subscribedChildren);
      request.buildAndRunQuery(
        this.responseBuilder,
        this.root,
        this.next,
        this.storeSubscribe,
        metadata,
      );
      this.activeRequests.push(request);
    }
  }
}

type QuerySetChildWithPath = {
  child: SerializableQuerySetChild;
  path: Array<SerializableQuerySetChild>;
};

function flattenQuerySetChildren(
  children: Array<SerializableQuerySetChild>,
  path: Array<SerializableQuerySetChild> = [],
): Array<QuerySetChildWithPath> {
  return flatMap(children, (child) =>
    hasChildOperations(child) && child.properties.children
      ? [
          { child, path },
          ...flattenQuerySetChildren(
            child.properties.children as Array<SerializableQuerySetChild>,
            [...path, child],
          ),
        ]
      : [{ child, path }],
  );
}

function compareQuerySetChildWithPath(
  lChild: QuerySetChildWithPath,
  rChild: QuerySetChildWithPath,
): boolean {
  return (
    lChild.child.properties.operation.id === rChild.child.properties.operation.id &&
    lChild.child.type === rChild.child.type &&
    lChild.path.every((lp) =>
      rChild.path.some(
        (rp) => lp.properties.operation.id === rp.properties.operation.id && lp.type === rp.type,
      ),
    )
  );
}

function hasChildOperations(
  querySetChild: SerializableQuerySetChild,
): querySetChild is
  | QuerySetOperationNodeDefinition
  | QuerySetGetChildOperationNodeDefinition
  | QuerySetGetItemsOperationNodeDefinition {
  return (
    isQuerySetOperationNodeDefinition(querySetChild) ||
    isQuerySetGetChildOperationNodeDefinition(querySetChild) ||
    isQuerySetGetItemsOperationNodeDefinition(querySetChild)
  );
}

interface NodeWithCallback<T extends NodeDefinition = NodeDefinition> {
  callback: NodeDefinitionCallback;
  node: T;
}

export type StoreSubscribe = (
  node: GraphNode,
  operation: GraphOperation,
  callback: UpdateCallback,
) => DisposeCallback;

class Request {
  private disposeSubscription: DisposeCallback | undefined;
  root: RequestNode;

  constructor(public children: Array<QuerySetChildWithPath>) {
    this.root = new RequestNode([]);
    children.forEach((c) => this.root.addChild(c.path, c.child));
  }

  private buildQuery(
    responseBuilder: ResponseBuilder,
    querySetRoot: NodeDefinition,
  ): NodeWithCallback<QuerySetNodeDefinition> {
    const children = this.root.children.map((c) => c.buildNodeWithCallback(responseBuilder));
    return {
      node: querySet(querySetRoot, children.map((c) => c.node)),
      callback: (response) => {
        // Call the children callbacks
        if (!isArrayNodeDefinition(response)) {
          children.forEach((child) => child.callback(response));
        } else {
          const { items } = response.properties;
          children.forEach((child, index) => child.callback(items[index]));
        }
        // And then notify the response builder that updates are finished
        responseBuilder.valuesUpdated();
      },
    };
  }

  buildAndRunQuery(
    responseBuilder: ResponseBuilder,
    querySetRoot: NodeDefinition,
    nextMiddleware: GraphNode,
    subscribe: StoreSubscribe,
    metadata: RequestMetadata,
  ): void {
    const query = this.buildQuery(responseBuilder, querySetRoot);
    const traverseQuery = traverse(nextMiddleware, requestOperation(query.node, metadata));
    this.disposeSubscription = subscribe(
      withScopeFrom(nextMiddleware, traverseQuery),
      resolveOperation(),
      (node) => query.callback(node.definition),
    );
  }

  canBeDisposed(): boolean {
    return this.root.canBeDisposed();
  }

  dispose(): void {
    if (!this.disposeSubscription) return;
    this.disposeSubscription();
    this.disposeSubscription = undefined;
  }

  disposePath(path: Array<SerializableQuerySetChild>): void {
    this.root.disposeChild(path);
  }
}

class RequestNode {
  children: Array<RequestChild> = [];
  isDisposed: boolean;

  constructor(public path: Array<SerializableQuerySetChild>) {}

  addChild(path: Array<SerializableQuerySetChild>, child: SerializableQuerySetChild): void {
    if (path.length === 0) {
      // Check if the child already exists
      if (this.findChild(child)) return;
      this.children.push(new RequestChild([...this.path, child], child));
      return;
    }
    const [childToFind, ...remainingPath] = path;
    let childToAddTo = this.findChild(childToFind);
    if (!childToAddTo) {
      childToAddTo = new RequestChild([...this.path, childToFind], childToFind);
      this.children.push(childToAddTo);
    }
    childToAddTo.addChild(remainingPath, child);
  }

  canBeDisposed(): boolean {
    return this.children.every((child) => child.canBeDisposed());
  }

  disposeChild(path: Array<SerializableQuerySetChild>): void {
    if (path.length === 0) return;
    const [child, ...remainingPath] = path;
    const foundChild = this.findChild(child);
    if (!foundChild) return;
    if (remainingPath.length === 0) {
      foundChild.isDisposed = true;
    } else {
      foundChild.disposeChild(remainingPath);
    }
  }

  findChild(child: SerializableQuerySetChild): RequestChild | undefined {
    return this.children.find(
      (c) =>
        c.child.properties.operation.id === child.properties.operation.id &&
        c.child.type === child.type,
    );
  }
}

class RequestChild extends RequestNode {
  constructor(
    public path: Array<SerializableQuerySetChild>,
    public child: SerializableQuerySetChild,
  ) {
    super(path);
  }

  private buildNode(children: Array<SerializableQuerySetChild>): SerializableQuerySetChild {
    const sanitizedChildren = children.length > 0 ? children : undefined;
    if (isQuerySetOperationNodeDefinition(this.child)) {
      return querySetOperation(this.child.properties.operation, sanitizedChildren);
    }
    if (isQuerySetCallOperationNodeDefinition(this.child)) {
      return querySetCallOperation(this.child.properties.operation);
    }
    if (isQuerySetGetChildOperationNodeDefinition(this.child)) {
      return querySetGetChildOperation(this.child.properties.operation, sanitizedChildren);
    }
    if (isQuerySetGetItemsOperationNodeDefinition(this.child)) {
      return querySetGetItemsOperation({
        operation: this.child.properties.operation,
        children: sanitizedChildren,
      });
    }
    if (isQuerySetSetOperationNodeDefinition(this.child)) {
      return querySetSetOperation(this.child.properties.operation);
    }
    throw getInvalidTypeError('Invalid type of QuerySetChild:', {
      expected: [
        QuerySetOperationNodeType,
        QuerySetCallOperationNodeType,
        QuerySetGetChildOperationNodeType,
        QuerySetGetItemsOperationNodeType,
        QuerySetSetOperationNodeType,
      ],
      received: this.child,
    });
  }

  buildNodeWithCallback(
    responseBuilder: ResponseBuilder,
  ): NodeWithCallback<SerializableQuerySetChild> {
    const childQueries = this.children.map((child) => child.buildNodeWithCallback(responseBuilder));
    const queryNode = this.buildNode(childQueries.map((c) => c.node));
    return {
      node: queryNode,
      callback: (node) => {
        if (childQueries.length === 0 || isQuerySetGetItemsOperationNodeDefinition(queryNode)) {
          responseBuilder.updateValue(this.path, node);
          return;
        }
        if (!isArrayNodeDefinition(node)) {
          childQueries.forEach((child) => child.callback(node));
          return;
        }
        childQueries.forEach((child, index) => child.callback(node.properties.items[index]));
      },
    };
  }

  canBeDisposed(): boolean {
    const operation = this.path[this.path.length - 1].properties.operation;
    return (
      this.isDisposed ||
      ((isGetChildOperation(operation) || isGetItemsOperation(operation)) &&
        this.children.every((child) => child.canBeDisposed()))
    );
  }
}

class ResponseBuilder {
  private root: ResponseBuilderNode = new ResponseBuilderNode();

  constructor(private onValueUpdated: NodeDefinitionCallback) {}

  private getResponse(): NodeDefinition {
    return this.root.getCombinedResponse();
  }

  updateQuery(children: Array<SerializableQuerySetChild>): void {
    this.root.updateShape(children);
    this.valuesUpdated();
  }

  updateValue(path: Array<SerializableQuerySetChild>, value: NodeDefinition): void {
    this.root.updateValue(path, value);
  }

  valuesUpdated(): void {
    this.onValueUpdated(this.getResponse());
  }
}

class ResponseBuilderNode {
  children: Array<ResponseBuilderChild> = [];

  private findChild(querySetChild: SerializableQuerySetChild): ResponseBuilderChild | undefined {
    return this.children.find(
      (c) =>
        c.querySetChild.properties.operation.id === querySetChild.properties.operation.id &&
        c.querySetChild.type === querySetChild.type,
    );
  }

  getCombinedResponse(): NodeDefinition {
    const responses: Array<NodeDefinition> = [];
    for (const child of this.children) {
      const response = child.getCombinedResponse();
      // Short-circuit pending response
      if (isPendingNodeDefinition(response)) return response;
      responses.push(response);
    }
    return array(responses);
  }

  updateShape(children: Array<SerializableQuerySetChild>): void {
    this.children = children.map((child) => {
      let responseBuilderChild = this.findChild(child);
      if (!responseBuilderChild) {
        responseBuilderChild = new ResponseBuilderChild(child);
      }
      if (hasChildOperations(child)) {
        responseBuilderChild.updateShape(
          (child.properties.children as Array<SerializableQuerySetChild>) || [],
        );
      } else {
        responseBuilderChild.updateShape([]);
      }
      return responseBuilderChild;
    });
  }

  updateValue(path: Array<SerializableQuerySetChild>, value: NodeDefinition): void {
    if (path.length === 0) return;
    const [querySetChild, ...remainingPath] = path;
    const foundChild = this.findChild(querySetChild);
    if (!foundChild) return;
    if (remainingPath.length === 0) {
      foundChild.value = value;
    } else {
      foundChild.updateValue(remainingPath, value);
    }
  }
}

class ResponseBuilderChild extends ResponseBuilderNode {
  value: NodeDefinition | undefined;

  constructor(public querySetChild: SerializableQuerySetChild) {
    super();
  }

  getCombinedResponse(): NodeDefinition {
    if (
      isQuerySetGetItemsOperationNodeDefinition(this.querySetChild) ||
      this.children.length === 0
    ) {
      return this.value || pending();
    }
    return super.getCombinedResponse();
  }
}
