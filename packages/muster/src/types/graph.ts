import { EventEmitter } from '../utils/emitter';
import { HashFunction } from '../utils/hash';
import { SerializedStore } from '../utils/inspect';
import { Matcher, MatcherFactory, MatcherMetadata } from './matchers';
import { Stream } from './stream';

export const CONTEXT = Symbol.for('muster::CONTEXT');
export const GRAPH_NODE = Symbol.for('muster::GRAPH_NODE');
export const GRAPH_OPERATION = Symbol.for('muster::GRAPH_OPERATION');
export const GRAPH_ACTION = Symbol.for('muster::GRAPH_ACTION');
export const NODE_DEFINITION = Symbol.for('muster::NODE_DEFINITION');
export const NODE_TYPE = Symbol.for('muster::NODE_TYPE');
export const OPERATION_TYPE = Symbol.for('muster::OPERATION_TYPE');
export const SCOPE = Symbol.for('muster::SCOPE');
export const MATCHER = Symbol.for('muster::MATCHER');
export const PROXIED_NODE = Symbol('muster::PROXIED_NODE');
export const PROXIED_NODE_DEFINITION = Symbol('muster::PROXIED_NODE_DEFINITION');

export type NodeLike = any;

export type NodeType<
  T extends NodeName = NodeName,
  P extends NodeProperties = NodeProperties,
  S extends NodeState = NodeState,
  D extends NodeData = NodeData,
  V extends SerializedNodeProperties = P,
  M extends OperationName = OperationName,
  O extends GraphOperation<M> = GraphOperation<M>
> = StaticNodeType<T, P, V> | DynamicNodeType<T, P, S, D, V, M, O>;

export type NodeName = string;
export type NodeProperties = {};
export type SerializableObject = NodeDefinition | GraphOperation | Matcher<any, any>;
export type SerializedNodeProperties = any;
export type SerializedOperationProperties = any;

export interface StaticNodeType<
  T extends NodeName = NodeName,
  P extends NodeProperties = NodeProperties,
  V extends SerializedNodeProperties = P
> {
  [NODE_TYPE]: true;
  name: T;
  hash: HashFunction<P>;
  shape: Matcher<P>;
  serialize: false | undefined | (<T>(value: P, serialize: (value: SerializableObject) => T) => V);
  deserialize:
    | false
    | undefined
    | (<T>(properties: V, deserialize: (node: T) => SerializableObject) => P);
  is: (value: GraphNode) => value is GraphNode<T, P, never, V>;
  getType?: (properties: P, getType: (value: any) => string) => string;
}

export interface StaticNodeDefinition<
  T extends NodeName = NodeName,
  P extends NodeProperties = NodeProperties,
  V extends SerializedNodeProperties = P,
  N extends StaticNodeType<T, P, V> = StaticNodeType<T, P, V>
> extends NodeDefinition<T, P, never, never, V, N> {}

export interface StaticGraphNode<
  T extends NodeName = NodeName,
  P extends NodeProperties = NodeProperties,
  V extends SerializedNodeProperties = P,
  N extends StaticNodeType<T, P, V> = StaticNodeType<T, P, V>
> extends GraphNode<T, P, never, never, V, N> {}

export type DynamicNodeType<
  T extends NodeName = NodeName,
  P extends NodeProperties = NodeProperties,
  S extends NodeState = NodeState,
  D extends NodeData = NodeData,
  V extends SerializedNodeProperties = P,
  M extends OperationName = OperationName,
  O extends GraphOperation<M> = GraphOperation<M>
> = StatelessNodeType<T, P, V, M, O> | StatefulNodeType<T, P, S, D, V, M, O>;

export interface DynamicNodeDefinition<
  T extends NodeName = NodeName,
  P extends NodeProperties = NodeProperties,
  S extends NodeState = NodeState,
  D extends NodeData = NodeData,
  V extends SerializedNodeProperties = P,
  M extends OperationName = OperationName,
  O extends GraphOperation<M> = GraphOperation<M>,
  N extends DynamicNodeType<T, P, S, D, V, M, O> = DynamicNodeType<T, P, S, D, V, M, O>
> extends NodeDefinition<T, P, S, D, V, N> {}

export interface DynamicGraphNode<
  T extends NodeName = NodeName,
  P extends NodeProperties = NodeProperties,
  S extends NodeState = NodeState,
  D extends NodeData = NodeData,
  V extends SerializedNodeProperties = P,
  M extends OperationName = OperationName,
  O extends GraphOperation<M> = GraphOperation<M>,
  N extends DynamicNodeType<T, P, S, D, V> = DynamicNodeType<T, P, S, D, V, M, O>
> extends GraphNode<T, P, S, D, V, N> {}

export interface StatelessNodeType<
  T extends NodeName = NodeName,
  P extends NodeProperties = NodeProperties,
  V extends SerializedNodeProperties = P,
  M extends OperationName = OperationName,
  O extends GraphOperation<M> = GraphOperation<M>
> extends StaticNodeType<T, P, V> {
  operations: { [K in M]: StatelessOperationHandler<T, P, V, M, GraphOperation<K> & O> };
}
export interface StatelessNodeDefinition<
  T extends NodeName = NodeName,
  P extends NodeProperties = NodeProperties,
  V extends SerializedNodeProperties = P,
  N extends StatelessNodeType<T, P, V> = StatelessNodeType<T, P, V>
> extends NodeDefinition<T, P, never, never, V, N> {}
export interface StatelessGraphNode<
  T extends NodeName = NodeName,
  P extends NodeProperties = NodeProperties,
  V extends SerializedNodeProperties = P,
  N extends StatelessNodeType<T, P, V> = StatelessNodeType<T, P, V>
> extends GraphNode<T, P, never, never, V, N> {}

export interface StatefulNodeType<
  T extends NodeName = NodeName,
  P extends NodeProperties = NodeProperties,
  S extends NodeState = NodeState,
  D extends NodeData = NodeData,
  V extends SerializedNodeProperties = P,
  M extends OperationName = OperationName,
  O extends GraphOperation<M> = GraphOperation<M>
> extends StaticNodeType<T, P, V> {
  state: Matcher<S>;
  hashState: HashFunction<S>;
  getInitialState(properties: P): S;
  operations: { [K in M]: StatefulOperationHandler<T, P, S, D, V, M, GraphOperation<K> & O> };
  onSubscribe?(node: StatefulGraphNode<T, P, S, D, V, M, O, this>): void;
  onUnsubscribe?(node: StatefulGraphNode<T, P, S, D, V, M, O, this>): void;
}
export interface StatefulNodeDefinition<
  T extends NodeName = NodeName,
  P extends NodeProperties = NodeProperties,
  S extends NodeState = NodeState,
  D extends NodeData = NodeData,
  V extends SerializedNodeProperties = P,
  M extends OperationName = OperationName,
  O extends GraphOperation<M> = GraphOperation<M>,
  N extends StatefulNodeType<T, P, S, D, V, M, O> = StatefulNodeType<T, P, S, D, V, M, O>
> extends NodeDefinition<T, P, S, D, V, N> {}
export interface StatefulGraphNode<
  T extends NodeName = NodeName,
  P extends NodeProperties = NodeProperties,
  S extends NodeState = NodeState,
  D extends NodeData = NodeData,
  V extends SerializedNodeProperties = P,
  M extends OperationName = OperationName,
  O extends GraphOperation<M> = GraphOperation<M>,
  N extends StatefulNodeType<T, P, S, D, V, M, O> = StatefulNodeType<T, P, S, D, V, M, O>
> extends GraphNode<T, P, S, D, V, N> {}

export type OperationHandler<
  T extends NodeName = NodeName,
  P extends NodeProperties = NodeProperties,
  S extends NodeState = NodeState,
  D extends NodeData = NodeData,
  V extends SerializedNodeProperties = P,
  M extends OperationName = OperationName,
  O extends GraphOperation<M> = GraphOperation<M>
> = StatelessOperationHandler<T, P, V, M, O> | StatefulOperationHandler<T, P, S, D, V, M, O>;

export interface StatelessOperationHandler<
  T extends NodeName = NodeName,
  P extends NodeProperties = NodeProperties,
  V extends SerializedNodeProperties = P,
  M extends OperationName = OperationName,
  O extends GraphOperation<M> = GraphOperation<M>
> {
  cacheable: boolean;
  getDependencies: (
    definition: NodeDefinition<T, P, never, never, V>,
    operation: O,
  ) => Array<Dependency>;
  getContextDependencies: (
    node: NodeDefinition<T, P, never, never, V>,
    operation: O,
  ) => Array<ContextDependency>;
  run(
    node: GraphNode<T, P, never, never, V>,
    operation: O,
    dependencies: Array<GraphNode>,
    context: Array<GraphNode>,
    state: undefined,
  ): GraphNode | GraphAction;
}

export interface StatefulOperationHandler<
  T extends NodeName = NodeName,
  P extends NodeProperties = NodeProperties,
  S extends NodeState = NodeState,
  D extends NodeData = NodeData,
  V extends SerializedNodeProperties = P,
  M extends OperationName = OperationName,
  O extends GraphOperation<M> = GraphOperation<M>
> {
  cacheable: boolean;
  getDependencies(node: NodeDefinition<T, P, S, D, V>, operation: O): Array<Dependency>;
  getContextDependencies(
    node: NodeDefinition<T, P, S, D, V>,
    operation: O,
  ): Array<ContextDependency>;
  run(
    node: GraphNode<T, P, S, D, V>,
    operation: O,
    dependencies: Array<GraphNode>,
    context: Array<GraphNode>,
    state: S,
  ): GraphNode | GraphAction;
  onInvalidate?(
    node: StatefulGraphNode<T, P, S, D, V, M, O, StatefulNodeType<T, P, S, D, V, M, O>>,
    operation: O,
  ): void;
  onSubscribe?(
    node: StatefulGraphNode<T, P, S, D, V, M, O, StatefulNodeType<T, P, S, D, V, M, O>>,
    operation: O,
  ): void;
  onUpdate?(
    node: StatefulGraphNode<T, P, S, D, V, M, O, StatefulNodeType<T, P, S, D, V, M, O>>,
    operation: O,
    dependencies: Array<GraphNode>,
    context: Array<GraphNode>,
    previousDependencies: Array<GraphNode> | undefined,
  ): void;
  onUnsubscribe?(
    node: StatefulGraphNode<T, P, S, D, V, M, O, StatefulNodeType<T, P, S, D, V, M, O>>,
    operation: O,
  ): void;
}

export type NodeState = any;
export type NodeData = { [key: string]: any };

export interface NodeExecutionContext<S extends NodeState, D extends NodeData> {
  getData(): Partial<D>;
  setData(update: ValueUpdater<D>): Partial<D>;
  getState(): S;
  setState(update: ValueUpdater<S>, callback?: (state: S) => void): void;
  retain(): number;
  release(): number;
}

export type ValueUpdater<T> = Partial<{ [key in keyof T]: T[key] }> | ((previous: T) => T);

export interface NodeDependencyUntilCondition {
  predicate: (node: GraphNode) => boolean;
  errorMessage?: (node: GraphNode) => string;
}

export interface ResolveOptions {
  until?: NodeDependencyUntilCondition;
  acceptNil?: boolean;
}

export interface DependencyOptions {
  allowErrors?: boolean;
  allowPending?: boolean;
  acceptNil?: boolean;
  until?: NodeDependencyUntilCondition;
  once?: boolean;
  invalidate?: boolean;
}

export interface NodeDependency extends DependencyOptions {
  target: NodeDefinition | GraphNode;
}

export interface Dependency {
  target: NodeDefinition | GraphNode;
  operation: GraphOperation;
  allowErrors: boolean;
  allowPending: boolean;
  invalidate: boolean;
}

export interface RequiredContextDependency extends DependencyOptions {
  name: string | symbol;
  required: true | string | ((node: GraphNode, name: string | symbol) => string);
}
export interface OptionalContextDependency extends DependencyOptions {
  name: string | symbol;
  required: false;
  defaultValue: NodeDefinition;
}
export type ContextDependency = RequiredContextDependency | OptionalContextDependency;

export interface NodeDefinition<
  T extends NodeName = any,
  P extends NodeProperties = any,
  S extends NodeState = NodeState,
  D extends NodeData = NodeData,
  V extends SerializedNodeProperties = P,
  N extends NodeType<T, P, S, D, V> = NodeType<T, P, S, D, V>
> {
  [NODE_DEFINITION]: true;
  id: string;
  type: N;
  properties: P;
}

export type SerializedNodeDefinition<
  T extends NodeName = NodeName,
  P extends NodeProperties = NodeProperties,
  V extends SerializedNodeProperties = P,
  N extends NodeType<T, P, any, V> = NodeType<T, P, any, V>
> = {
  $type: N['name'];
  data: V;
};

export interface GraphNode<
  T extends NodeName = NodeName,
  P extends NodeProperties = NodeProperties,
  S extends NodeState = NodeState,
  D extends NodeData = NodeData,
  V extends SerializedNodeProperties = P,
  N extends NodeType<T, P, S, D, V> = NodeType<T, P, S, D, V>
> {
  [GRAPH_NODE]: true;
  id: string;
  definition: NodeDefinition<T, P, S, D, V, N>;
  scope: Scope;
  context: Context;
}

export type NodeStream<T extends GraphNode = GraphNode> = Stream<T>;

export interface Scope {
  [SCOPE]: true;
  id: string;
  globalEvents: MusterEventSource;
  store: Store;
  events: MusterEventSource;
  parent: Scope | undefined;
  onSubscribe: (() => void) | undefined;
  onUnsubscribe: (() => void) | undefined;
}

export interface Context {
  [CONTEXT]: true;
  id: string;
  root: Context;
  parent: Context | undefined;
  values: ContextValues;
}

export type ContextName = string;
export type ContextValues = { [key in ContextName]: GraphNode };

export interface OperationType<
  N extends OperationName = OperationName,
  P extends OperationProperties = OperationProperties,
  S extends SerializedOperationProperties = P
> {
  [OPERATION_TYPE]: true;
  name: N;
  shape: Matcher<P>;
  hash: HashFunction<P>;
  serialize: false | undefined | (<T>(value: P, serialize: (value: SerializableObject) => T) => S);
  deserialize:
    | false
    | undefined
    | (<T>(value: S, deserialize: (value: T) => SerializableObject) => P);
}

export type OperationName = string;
export type OperationProperties = {};

export interface GraphOperation<
  T extends OperationName = OperationName,
  P extends OperationProperties = OperationProperties,
  S extends SerializedOperationProperties = P,
  O extends OperationType<T, P, S> = OperationType<T, P, S>
> {
  [GRAPH_OPERATION]: true;
  id: string;
  type: O;
  properties: P;
}

export type SerializedGraphOperation<
  T extends OperationName = OperationName,
  P extends OperationProperties = OperationProperties,
  S extends SerializedOperationProperties = P,
  O extends OperationType<T, P, S> = OperationType<T, P, S>
> = {
  $operation: O['name'];
  id: string;
  data: P;
};

export interface GraphAction<
  T extends NodeName = NodeName,
  P extends NodeProperties = NodeProperties,
  S extends NodeState = NodeState,
  D extends NodeData = NodeData,
  V extends SerializedNodeProperties = P,
  M extends OperationName = OperationName,
  O extends GraphOperation<M> = GraphOperation<M>,
  N1 extends StaticNodeType<T, P, V> = StaticNodeType<T, P, V>,
  N2 extends DynamicNodeType<T, P, S, D, V> = DynamicNodeType<T, P, S, D, V, M, O>
> {
  [GRAPH_ACTION]: true;
  id: string;
  node: StaticGraphNode<T, P, V, N1> | DynamicGraphNode<T, P, S, D, V, M, O, N2>;
  operation: GraphOperation;
}

export interface StaticGraphAction<
  T extends NodeName = NodeName,
  P extends NodeProperties = NodeProperties,
  V extends SerializedNodeProperties = P,
  N extends StaticNodeType<T, P, V> = StaticNodeType<T, P, V>
> {
  [GRAPH_ACTION]: true;
  id: string;
  node: StaticGraphNode<T, P, V, N>;
  operation: GraphOperation;
}

export interface DynamicGraphAction<
  T extends NodeName = NodeName,
  P extends NodeProperties = NodeProperties,
  S extends NodeState = NodeState,
  D extends NodeData = NodeData,
  V extends SerializedNodeProperties = P,
  M extends OperationName = OperationName,
  O extends GraphOperation<M> = GraphOperation<M>,
  N extends DynamicNodeType<T, P, S, D, V> = DynamicNodeType<T, P, S, D, V, M, O>
> {
  [GRAPH_ACTION]: true;
  id: string;
  node: DynamicGraphNode<T, P, S, D, V, M, O, N>;
  operation: GraphOperation;
}

export type ChildKey = any;
export interface Params {
  [id: string]: ChildKey;
}

export interface CreateChildScopeOptions {
  retain: () => number;
  release: () => number;
  redispatch?: ((event: MusterEvent) => MusterEvent | undefined) | true;
}

export interface Store {
  subscribe(
    node: GraphNode,
    operation: GraphOperation,
    callback: UpdateCallback,
    options?: { debug?: boolean },
  ): DisposeCallback;
  retain(node: GraphNode, operation?: GraphOperation): number;
  release(node: GraphNode, operation?: GraphOperation): number;
  invalidate(node: GraphNode, operation?: GraphOperation): boolean;
  getNodeData<D extends NodeData>(
    node: StatefulGraphNode<NodeName, NodeProperties, NodeState, D>,
  ): D | undefined;
  setNodeData<D extends NodeData>(
    node: StatefulGraphNode<NodeName, NodeProperties, NodeState, D>,
    data: D,
  ): void;
  getNodeState<S extends NodeState>(
    node: StatefulGraphNode<NodeName, NodeProperties, S>,
  ): S | undefined;
  setNodeState<S extends NodeState>(
    node: StatefulGraphNode<NodeName, NodeProperties, S>,
    state: S,
  ): void;
  disposeScope(scope: Scope): void;
  inspect(): SerializedStore;
}

export type UpdateCallback = (value: GraphNode) => void;
export type DisposeCallback = () => void;

export interface MusterEvent<
  T extends MusterEventName = MusterEventName,
  V extends MusterEventPayload = MusterEventPayload
> {
  type: T;
  payload: V;
}

export type MusterEventName = string;
export type MusterEventPayload = any;

export type MusterEventSource<
  T extends MusterEventName = MusterEventName,
  V extends MusterEventPayload = MusterEventPayload
> = EventEmitter<MusterEvent<T, V>>;

export type MusterTypeName = string;
export interface MusterType<N extends MusterTypeName> {
  name: N;
  deserialize: (
    value: SerializedMusterTypeData | undefined,
    deserialize: (value: any) => any,
  ) => Matcher<any, any>;
  serialize?: (
    value: Matcher<any, any>,
    serialize: (value: any) => any,
  ) => SerializedMusterTypeData;
}

export interface SerializedMusterType<N extends MusterTypeName = string> {
  $musterType: string;
  data: SerializedMusterTypeData | undefined;
}

export type SerializedMusterTypeData = any;

export type MusterTypeMap = { [name in MusterTypeName]: MusterType<any> };
export type NodeTypeMap = { [name in NodeName]: NodeType };
export type OperationTypeMap = { [name in OperationName]: OperationType };

export interface ProxiedNode {
  [PROXIED_NODE]: NodeDefinition | GraphNode;
  [PROXIED_NODE_DEFINITION]: NodeDefinition;
}

export function getProxiedNodeValue(value: ProxiedNode): NodeDefinition | GraphNode {
  return value[PROXIED_NODE];
}

export function getProxiedNodeDefinition(value: ProxiedNode): NodeDefinition {
  return value[PROXIED_NODE_DEFINITION];
}

export function isProxiedNode(value: any): value is ProxiedNode {
  return typeof value === 'object' && value !== null && value[PROXIED_NODE] !== undefined;
}

export function isScope(value: any): value is Scope {
  return SCOPE in value;
}

export function isNodeDefinition(value: any): value is NodeDefinition {
  return typeof value === 'object' && value !== null && Boolean(value[NODE_DEFINITION]);
}

export function isNodeType(value: any): value is NodeType {
  return typeof value === 'object' && value !== null && Boolean(value[NODE_TYPE]);
}

export function isGraphNode(value: any): value is GraphNode {
  return typeof value === 'object' && value !== null && Boolean(value[GRAPH_NODE]);
}

export function isContext(value: any): value is Context {
  return typeof value === 'object' && value !== null && Boolean(value[CONTEXT]);
}

export function isOperationType(value: any): value is OperationType {
  return typeof value === 'object' && value !== null && Boolean(value[OPERATION_TYPE]);
}

export function isGraphOperation(value: any): value is GraphOperation {
  return typeof value === 'object' && value !== null && Boolean(value[GRAPH_OPERATION]);
}

export function isGraphAction(value: any): value is GraphAction {
  return typeof value === 'object' && value !== null && Boolean(value[GRAPH_ACTION]);
}

export function isEvent(value: any): value is MusterEvent {
  return Boolean(value) && typeof value === 'object' && typeof value.type === 'string';
}

export function isMatcher(value: any): value is Matcher<any, any> {
  return typeof value === 'function' && Boolean(value[MATCHER]);
}

export function getMatcherType<T, P>(
  matcher: Matcher<T, P>,
): Matcher<T, never> | MatcherFactory<T, P> {
  if (!isMatcher(matcher)) {
    throw new Error('Invalid type matcher');
  }
  return matcher.metadata.type;
}

export function getMatcherOptions<T, P>(matcher: Matcher<T, P>): P {
  if (!isMatcher(matcher)) {
    throw new Error('Invalid type matcher');
  }
  return matcher.metadata.options;
}

let unitTestMatcher: (value: any) => boolean = () => false;

export function createMatcher<T, P = never>(
  name: string,
  match: ((value: any) => boolean),
  options: P | undefined = undefined,
): Matcher<T, P> {
  const matchFunction = (value: any) => unitTestMatcher(value) || match(value);
  return Object.assign(matchFunction, {
    [MATCHER]: true,
    metadata: {
      name,
      type: matchFunction,
      options,
    } as MatcherMetadata<T, P>,
  }) as Matcher<T, P>;
}

export function setUnitTestMatcher(matcher: (value: any) => boolean) {
  unitTestMatcher = matcher;
}
