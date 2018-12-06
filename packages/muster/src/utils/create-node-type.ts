import mapValues from 'lodash/mapValues';
import { ResetOperation } from '../operations/reset';
import { SetOperation } from '../operations/set';
import {
  ContextDependency,
  Dependency,
  GraphAction,
  GraphNode,
  GraphOperation,
  isGraphNode,
  isNodeDefinition,
  NODE_TYPE,
  NodeData,
  NodeDefinition,
  NodeDependency,
  NodeExecutionContext,
  NodeName,
  NodeProperties,
  NodeState,
  NodeType,
  OperationName,
  SerializedNodeProperties,
  StatefulGraphNode,
  StatefulNodeType,
  StatefulOperationHandler,
  StatelessNodeType,
  StatelessOperationHandler,
  StaticNodeType,
} from '../types/graph';
import { ShapeFields } from '../types/matchers';
import { getInvalidTypeErrorMessage } from './get-invalid-type-error';
import { registerNodeType } from './types-registry';
import withScopeFrom from './with-scope-from';
import withTransaction from './with-transaction';

// tslint:disable:ordered-imports
// Ensure the graph hashers and matchers are loaded before any node types are created
import * as types from './types';
import * as hash from './hash';
import * as graphTypes from './graph-types';
import * as graphHash from './graph-hash';
// Ensure the imported types and hashers are not removed during tree-shaking process
// The `.toString()` call is to appease the webpack gods, and stop them from smiting us with the console warnings
types.any.toString();
hash.any.toString();
graphTypes.graphNode.toString();
graphHash.graphNode.toString();
// tslint:enable:ordered-imports

export type NodeTypeDefinition<
  T extends NodeName,
  P extends NodeProperties = NodeProperties,
  S extends NodeState = NodeState,
  D extends NodeData = NodeData,
  V extends SerializedNodeProperties = P,
  M extends OperationName = OperationName
> =
  | StaticNodeTypeDefinition<P, V>
  | StatelessNodeTypeDefinition<T, P, V, M>
  | StatefulNodeTypeDefinition<T, P, S, D, V, M>;

export type OperationHandlerDefinition<
  T extends NodeName = NodeName,
  P extends NodeProperties = NodeProperties,
  S extends NodeState = NodeState,
  D extends NodeData = NodeData,
  V extends SerializedNodeProperties = P,
  M extends OperationName = OperationName
> =
  | StatelessOperationHandlerDefinition<T, P, V, M>
  | StatefulOperationHandlerDefinition<T, P, S, D, V, M>;

export interface StaticNodeTypeDefinition<
  P extends NodeProperties = NodeProperties,
  V extends SerializedNodeProperties = P
> {
  shape: ShapeFields<P>;
  serialize?: false | (<T>(value: P, serialize: (node: NodeDefinition) => T) => V);
  deserialize?: false | (<T>(properties: V, deserialize: (node: T) => NodeDefinition) => P);
  getType?: (properties: P, getType: (value: any) => string) => string;
}

export interface StatelessNodeTypeDefinition<
  T extends NodeName,
  P extends NodeProperties = NodeProperties,
  V extends SerializedNodeProperties = P,
  M extends OperationName = OperationName
> extends StaticNodeTypeDefinition<P, V> {
  operations?: { [K in M]: StatelessOperationHandlerDefinition<T, P, V, K, GraphOperation<K>> };
}

export interface StatelessOperationHandlerDefinition<
  T extends NodeName = NodeName,
  P extends NodeProperties = NodeProperties,
  V extends SerializedNodeProperties = P,
  M extends OperationName = OperationName,
  O extends GraphOperation<M> = GraphOperation<M>
> {
  cacheable?: boolean;
  getDependencies?: (properties: P, options: O) => Array<NodeDependency>;
  getContextDependencies?: (properties: P, options: O) => Array<ContextDependency>;
  run(
    node: GraphNode<T, P, never, V>,
    operation: O,
    dependencies: Array<GraphNode>,
    context: Array<GraphNode>,
  ): NodeDefinition | GraphNode | GraphAction;
}

export interface StatefulNodeTypeDefinition<
  T extends NodeName,
  P extends NodeProperties = NodeProperties,
  S extends NodeState = NodeState,
  D extends NodeData = NodeData,
  V extends SerializedNodeProperties = P,
  M extends OperationName = OperationName
> extends StaticNodeTypeDefinition<P, V> {
  state: ShapeFields<S>;
  getInitialState(properties: P): S;
  onSubscribe?(this: NodeExecutionContext<S, D>, node: StatefulGraphNode<T, P, S, D, V>): void;
  onUpdate?(
    this: NodeExecutionContext<S, D>,
    node: StatefulGraphNode<T, P, S, D, V>,
    dependencies: Array<GraphNode>,
    previousDependencies: Array<GraphNode>,
  ): void;
  onUnsubscribe?(this: NodeExecutionContext<S, D>, node: StatefulGraphNode<T, P, S, D, V>): void;
  operations?: {
    [K in M]: StatefulOperationHandlerDefinition<T, P, S, D, V, K, GraphOperation<K>>
  };
}

export interface StatefulOperationHandlerDefinition<
  T extends NodeName = NodeName,
  P extends NodeProperties = NodeProperties,
  S extends NodeState = NodeState,
  D extends NodeData = NodeData,
  V extends SerializedNodeProperties = P,
  M extends OperationName = OperationName,
  O extends GraphOperation<M> = GraphOperation<M>
> {
  cacheable?: boolean;
  getDependencies?: (properties: P, options: O) => Array<NodeDependency>;
  getContextDependencies?: (properties: P, options: O) => Array<ContextDependency>;
  run(
    node: GraphNode<T, P, S, D, V>,
    operation: O,
    dependencies: Array<GraphNode>,
    context: Array<GraphNode>,
    state: S,
  ): NodeDefinition | GraphNode | GraphAction;
  onInvalidate?(
    this: NodeExecutionContext<S, D>,
    node: StatefulGraphNode<T, P, S, D, V, M, O, StatefulNodeType<T, P, S, D, V, M, O>>,
    operation: O,
  ): void;
  onSubscribe?(
    this: NodeExecutionContext<S, D>,
    node: StatefulGraphNode<T, P, S, D, V, M, O, StatefulNodeType<T, P, S, D, V, M, O>>,
    operation: O,
  ): void;
  onUpdate?(
    this: NodeExecutionContext<S, D>,
    node: StatefulGraphNode<T, P, S, D, V, M, O, StatefulNodeType<T, P, S, D, V, M, O>>,
    operation: O,
    dependencies: Array<GraphNode>,
    contextDependencies: Array<GraphNode>,
    previousDependencies: Array<GraphNode> | undefined,
  ): void;
  onUnsubscribe?(
    this: NodeExecutionContext<S, D>,
    node: StatefulGraphNode<T, P, S, D, V, M, O, StatefulNodeType<T, P, S, D, V, M, O>>,
    operation: O,
  ): void;
}

/* tslint:disable:max-line-length */
export function createNodeType<T extends NodeName>(name: T): StaticNodeType<T, {}>;
export function createNodeType<
  T extends NodeName,
  P extends NodeProperties = NodeProperties,
  V extends SerializedNodeProperties = P
>(name: T, definition: StaticNodeTypeDefinition<P, V>): StaticNodeType<T, P, V>;
export function createNodeType<
  T extends NodeName,
  P extends NodeProperties = NodeProperties,
  V extends SerializedNodeProperties = P,
  M extends OperationName = OperationName
>(name: T, definition: StatelessNodeTypeDefinition<T, P, V, M>): StatelessNodeType<T, P, V, M>;
export function createNodeType<
  T extends NodeName,
  M extends OperationName = OperationName,
  O extends GraphOperation<M> = GraphOperation<M>
>(
  name: T,
  definition: Omit<StatelessNodeTypeDefinition<T, {}, {}, M>, 'shape'>,
): StatelessNodeType<T, {}, {}, M, O>;
export function createNodeType<
  T extends NodeName,
  P extends NodeProperties = NodeProperties,
  S extends NodeState = NodeState,
  D extends NodeData = NodeData,
  V extends SerializedNodeProperties = P,
  M extends OperationName = OperationName,
  O extends GraphOperation<M> = GraphOperation<M>
>(
  name: T,
  definition: StatefulNodeTypeDefinition<T, P, S, D, V, M>,
): StatefulNodeType<T, P, S, D, V, M, O>;
/* tslint:enable:max-line-length */
export function createNodeType<
  T extends NodeName,
  P extends NodeProperties = NodeProperties,
  S extends NodeState = NodeState,
  D extends NodeData = NodeData,
  V extends SerializedNodeProperties = P,
  M extends OperationName = OperationName
>(
  name: T,
  definition:
    | StatelessNodeTypeDefinition<T, P, V, M>
    | StatefulNodeTypeDefinition<T, P, S, D, V, M>
    | Omit<StatelessNodeTypeDefinition<T, P, V, M>, 'shape'> = {} as Omit<
    StatelessNodeTypeDefinition<T, P, V, M>,
    'shape'
  >,
): NodeType<T, P, S, D, V, M> {
  const {
    shape = {} as ShapeFields<P>,
    serialize,
    deserialize,
    operations,
  } = definition as StatefulNodeTypeDefinition<T, P, S, D, V, M>;
  const stateShape = (definition as StatefulNodeTypeDefinition<T, P, S, D, V, M>).state;
  const getInitialState = stateShape
    ? (definition as StatefulNodeTypeDefinition<T, P, S, D, V, M>).getInitialState
    : undefined;
  const onSubscribe = stateShape
    ? (definition as StatefulNodeTypeDefinition<T, P, S, D, V, M>).onSubscribe &&
      withNodeContext((definition as StatefulNodeTypeDefinition<T, P, S, D, V, M>).onSubscribe!)
    : undefined;
  const onUnsubscribe = stateShape
    ? (definition as StatefulNodeTypeDefinition<T, P, S, D, V, M>).onUnsubscribe &&
      withNodeContext((definition as StatefulNodeTypeDefinition<T, P, S, D, V, M>).onUnsubscribe!)
    : undefined;
  const nodeType: NodeType<T, P, S, D, V, M> = {
    [NODE_TYPE]: true,
    name,
    shape: types.shape(shape),
    is(value: GraphNode): value is GraphNode<T, P, S, D, V, typeof nodeType> {
      return isGraphNode(value) && value.definition.type === nodeType;
    },
    state: stateShape ? types.shape(stateShape) : undefined,
    getInitialState,
    onSubscribe,
    onUnsubscribe,
    hash: hash.shape(shape),
    hashState: stateShape ? hash.shape(stateShape) : undefined,
    serialize,
    deserialize,
    getType: definition.getType,
    ...(operations && {
      operations: mapValues(
        operations,
        (operation: StatefulOperationHandlerDefinition<T, P, S, D, V, M>, name) =>
          parseOperation(name, operation, definition as StatefulNodeTypeDefinition<
            T,
            P,
            S,
            D,
            V,
            M
          >),
      ),
    }),
  } as NodeType<T, P, S, D, V, M>;
  registerNodeType(nodeType);
  return nodeType;
}

// Additional node types used within the createNodeType implementation must be loaded after the
// default export has been defined to avoid circular dependency errors
import { error, ErrorNodeType, isErrorNodeDefinition } from '../nodes/graph/error';
import { OkNode, OkNodeType } from '../nodes/graph/ok';
import { resolve } from '../nodes/graph/resolve';
import parseNodeDependency from './parse-node-dependency';

/* tslint:disable:max-line-length */
function parseOperation<
  T extends NodeName = NodeName,
  P extends NodeProperties = NodeProperties,
  V extends SerializedNodeProperties = P,
  M extends OperationName = OperationName,
  O extends GraphOperation<M> = GraphOperation<M>
>(
  name: T,
  handler: StatelessOperationHandlerDefinition<T, P, V, M, O>,
  options: StatelessNodeTypeDefinition<T, P, V, M>,
): StatelessOperationHandler<T, P, V, M, O>;
function parseOperation<
  T extends NodeName = NodeName,
  P extends NodeProperties = NodeProperties,
  S extends NodeState = NodeState,
  D extends NodeData = NodeData,
  V extends SerializedNodeProperties = P,
  M extends OperationName = OperationName,
  O extends GraphOperation<M> = GraphOperation<M>
>(
  name: T,
  handler: StatefulOperationHandlerDefinition<T, P, S, D, V, M, O>,
  options: StatefulNodeTypeDefinition<T, P, S, D, V, M>,
): StatefulOperationHandler<T, P, S, D, V, M, O>;
/* tslint:enable:max-line-length */
function parseOperation<
  T extends NodeName = NodeName,
  P extends NodeProperties = NodeProperties,
  S extends NodeState = NodeState,
  D extends NodeData = NodeData,
  V extends SerializedNodeProperties = P,
  M extends OperationName = OperationName,
  O extends GraphOperation<M> = GraphOperation<M>
>(
  name: T,
  handler:
    | StatelessOperationHandlerDefinition<T, P, V, M, O>
    | StatefulOperationHandlerDefinition<T, P, S, D, V, M, O>,
  options: StatelessNodeTypeDefinition<T, P, V, M> | StatefulNodeTypeDefinition<T, P, S, D, V, M>,
): StatelessOperationHandler<T, P, V, M, O> | StatefulOperationHandler<T, P, S, D, V, M, O> {
  const stateful = options && (options as StatefulNodeTypeDefinition<T>).state;
  switch (name) {
    case 'set':
      if (!stateful) {
        throw new Error(`Set operations can only be defined on stateful nodes`);
      }
      return parseSetOperation(handler as StatefulOperationHandlerDefinition<
        T,
        P,
        S,
        D,
        V,
        M & 'set',
        O & SetOperation
      >) as StatefulOperationHandler<T, P, S, D, V, M & 'set', O & SetOperation>;
    case 'reset':
      if (!stateful) {
        throw new Error(`Reset operations can only be defined on stateful nodes`);
      }
      return parseResetOperation(handler as StatefulOperationHandlerDefinition<
        T,
        P,
        S,
        D,
        V,
        M & 'reset',
        O & ResetOperation
      >) as StatefulOperationHandler<T, P, S, D, V, M & 'reset', O & ResetOperation>;
    default:
      return stateful
        ? parseGenericOperation(
            handler as StatefulOperationHandlerDefinition<T, P, S, D, V, M, O>,
            { stateful: true },
          )
        : parseGenericOperation(handler as StatelessOperationHandlerDefinition<T, P, V, M, O>, {
            stateful: false,
          });
  }
}

function parseSetOperation<
  T extends NodeName = NodeName,
  P extends NodeProperties = NodeProperties,
  S extends NodeState = NodeState,
  D extends NodeData = NodeData,
  V extends SerializedNodeProperties = P
>(
  handler: StatefulOperationHandlerDefinition<T, P, S, D, V, 'set', SetOperation>,
): StatefulOperationHandler<T, P, S, D, V, 'set', SetOperation> {
  const rawHandler = parseGenericOperation(handler, { stateful: true });
  return {
    ...rawHandler,
    // tslint:disable-next-line:ter-prefer-arrow-callback
    run(
      node: StatefulGraphNode<
        T,
        P,
        S,
        D,
        V,
        'set',
        SetOperation,
        StatefulNodeType<T, P, S, D, V, 'set', SetOperation>
      >,
      operation: SetOperation,
      dependencies: Array<GraphNode>,
      context: Array<GraphNode>,
      state: S,
    ): GraphNode {
      const result = rawHandler.run(node, operation, dependencies, context, state) as GraphNode;
      const returnValueNode = withScopeFrom(node, operation.properties.value);
      return resolveSetResponse(result, returnValueNode);
    },
  };
}

function parseResetOperation<
  T extends NodeName = NodeName,
  P extends NodeProperties = NodeProperties,
  S extends NodeState = NodeState,
  D extends NodeData = NodeData,
  V extends SerializedNodeProperties = P
>(
  handler: StatefulOperationHandlerDefinition<T, P, S, D, V, 'reset', ResetOperation>,
): StatefulOperationHandler<T, P, S, D, V, 'reset', ResetOperation> {
  const rawHandler = parseGenericOperation(handler, { stateful: true });
  return {
    ...rawHandler,
    run(
      node: StatefulGraphNode<
        T,
        P,
        S,
        D,
        V,
        'reset',
        ResetOperation,
        StatefulNodeType<T, P, S, D, V, 'reset', ResetOperation>
      >,
      operation: ResetOperation,
      dependencies: Array<GraphNode>,
      context: Array<GraphNode>,
      state: S,
    ): GraphNode {
      const result = rawHandler.run(node, operation, dependencies, context, state) as GraphNode;
      return resolveResetResponse(result);
    },
  };
}

function resolveSetResponse(value: GraphNode, returnValue: GraphNode): GraphNode {
  if (ErrorNodeType.is(value)) {
    return value;
  }
  if (OkNodeType.is(value)) {
    return returnValue;
  }
  return withScopeFrom(
    value,
    resolve(
      [
        {
          target: value.definition,
          until: {
            predicate: OkNodeType.is,
            errorMessage(node: GraphNode): string {
              return getInvalidTypeErrorMessage('Invalid return type for set operation', {
                expected: OkNodeType,
                received: node.definition,
              });
            },
          },
        },
      ],
      ([result]: [OkNode]) => returnValue,
    ),
  );
}

function resolveResetResponse(value: GraphNode): GraphNode {
  if (ErrorNodeType.is(value) || OkNodeType.is(value)) {
    return value;
  }
  return withScopeFrom(
    value,
    resolve(
      [
        {
          target: value.definition,
          until: {
            predicate: OkNodeType.is,
            errorMessage(node: GraphNode): string {
              return getInvalidTypeErrorMessage('Invalid return type for reset operation', {
                expected: OkNodeType,
                received: node.definition,
              });
            },
          },
        },
      ],
      ([result]: [OkNode]) => result,
    ),
  );
}

/* tslint:disable:line-length */
function parseGenericOperation<
  T extends NodeName,
  P extends NodeProperties,
  V extends SerializedNodeProperties,
  M extends OperationName,
  O extends GraphOperation<M>
>(
  handler: StatelessOperationHandlerDefinition<T, P, V, M, O>,
  { stateful }: { stateful: false },
): StatelessOperationHandler<T, P, V, M, O>;
function parseGenericOperation<
  T extends NodeName,
  P extends NodeProperties,
  S extends NodeState,
  D extends NodeData,
  V extends SerializedNodeProperties,
  M extends OperationName,
  O extends GraphOperation<M>
>(
  handler: StatefulOperationHandlerDefinition<T, P, S, D, V, M, O>,
  { stateful }: { stateful: true },
): StatefulOperationHandler<T, P, S, D, V, M, O>;
/* tslint:enable:line-length */
function parseGenericOperation<
  T extends NodeName,
  P extends NodeProperties,
  S extends NodeState,
  D extends NodeData,
  V extends SerializedNodeProperties,
  M extends OperationName,
  O extends GraphOperation<M>
>(
  definition:
    | StatelessOperationHandlerDefinition<T, P, V, M, O>
    | StatefulOperationHandlerDefinition<T, P, S, D, V, M, O>,
  { stateful }: { stateful: boolean },
): StatelessOperationHandler<T, P, V, M, O> | StatefulOperationHandler<T, P, S, D, V, M, O> {
  const { getDependencies, getContextDependencies } = definition;
  const handler = {
    cacheable: definition.cacheable !== undefined ? definition.cacheable : true,
    getDependencies: getDependencies
      ? (definition: NodeDefinition<T, P, S, D, V>, operation: O): Array<Dependency> =>
          getDependencies(definition.properties, operation).map((dependency) =>
            parseNodeDependency(dependency.target, dependency),
          )
      : () => [],
    getContextDependencies: getContextDependencies
      ? (definition: NodeDefinition<T, P, S, D, V>, operation: O) =>
          getContextDependencies(definition.properties, operation)
      : () => [],
    run(
      node: GraphNode<T, P, S, D, V>,
      operation: GraphOperation,
      dependencies: Array<GraphNode>,
      context: Array<GraphNode>,
      state: S,
    ): GraphNode | GraphAction {
      let result: GraphNode | NodeDefinition | GraphAction;
      try {
        result = (definition as StatefulOperationHandlerDefinition).run(
          node,
          operation,
          dependencies,
          context,
          state,
        );
      } catch (e) {
        result = isNodeDefinition(e) && isErrorNodeDefinition(e) ? e : error(e);
      }
      return isNodeDefinition(result) ? withScopeFrom(node, result) : result;
    },
  };
  if (isStatefulOperationHandlerDefinition(definition, stateful)) {
    Object.assign(handler, {
      onInvalidate: definition.onInvalidate
        ? parseHandlerEvent(definition.onInvalidate!)
        : undefined,
      onSubscribe: definition.onSubscribe ? parseHandlerEvent(definition.onSubscribe!) : undefined,
      onUpdate: definition.onUpdate ? parseHandlerEvent(definition.onUpdate!) : undefined,
      onUnsubscribe: definition.onUnsubscribe
        ? parseHandlerEvent(definition.onUnsubscribe!)
        : undefined,
    });
  }
  return handler;
}

function isStatefulOperationHandlerDefinition(
  handlerDefinition: StatelessOperationHandlerDefinition | StatefulOperationHandlerDefinition,
  stateful: boolean,
): handlerDefinition is StatefulOperationHandlerDefinition {
  return stateful;
}

function parseHandlerEvent<
  T extends NodeName,
  P extends NodeProperties,
  S extends NodeState,
  D extends NodeData,
  V extends SerializedNodeProperties,
  M extends OperationName,
  O extends GraphOperation<M>,
  N extends StatefulGraphNode<T, P, S, D, V, M, O, StatefulNodeType<T, P, S, D, V, M, O>>,
  A
>(
  fn: (this: NodeExecutionContext<S, D>, node: N, operation: O, ...args: Array<A>) => void,
): (node: N, operation: O, ...args: Array<A>) => void {
  return (node: N, operation: O, ...args: Array<A>) => {
    const executionContext = createNodeExecutionContext(node);
    return fn.call(executionContext, node, operation, ...args);
  };
}

function withNodeContext<
  S extends NodeState,
  D extends NodeData,
  A,
  V,
  T extends StatefulGraphNode<NodeName, NodeProperties, S>
>(
  fn: (this: NodeExecutionContext<S, D>, node: T, ...args: Array<A>) => V,
): (node: T, ...args: Array<A>) => V {
  return (node: T, ...args: Array<A>): V => {
    const executionContext = createNodeExecutionContext(node);
    return fn.call(executionContext, node, ...args);
  };
}

function createNodeExecutionContext<S extends NodeState = NodeState, D extends NodeData = NodeData>(
  node: StatefulGraphNode<NodeName, NodeProperties, S>,
): NodeExecutionContext<S, D> {
  const store = node.scope.store;
  return {
    getData(): D {
      return store.getNodeData<D>(node)!;
    },
    setData(update: { [key in keyof D]: D[key] } | ((previousState: D) => D)): D {
      const currentData = store.getNodeData<D>(node)!;
      const updatedData =
        typeof update === 'function' ? update(currentData) : Object.assign({}, currentData, update);
      store.setNodeData<D>(node, updatedData);
      return updatedData;
    },
    getState(): S {
      return store.getNodeState<S>(node)!;
    },
    setState(
      update: { [key in keyof S]: S[key] } | ((previousState: S) => S),
      callback?: (state: S) => void,
    ): void {
      const currentState = store.getNodeState<S>(node);
      if (!currentState) {
        return;
      }
      const updatedState =
        typeof update === 'function'
          ? update(currentState)
          : Object.assign({}, currentState, update);
      const hashState = node.definition.type.hashState;
      if (currentState === updatedState || hashState(currentState) === hashState(updatedState)) {
        return;
      }
      withTransaction(node.scope, () => {
        store.setNodeState<S>(node, updatedState);
        if (callback) {
          callback(updatedState);
        }
      });
    },
    retain(): number {
      return store.retain(node);
    },
    release(): number {
      return store.release(node);
    },
  };
}
