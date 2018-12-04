import {
  Context,
  createMatcher,
  GraphAction,
  GraphNode,
  GraphOperation,
  isContext,
  isEvent,
  isGraphAction,
  isGraphNode,
  isGraphOperation,
  isNodeDefinition,
  isNodeType,
  isOperationType,
  isProxiedNode,
  isScope,
  MusterEvent,
  NodeDefinition,
  NodeDependency,
  NodeType,
  OperationType,
  ProxiedNode,
  Scope,
} from '../types/graph';
import { Matcher } from '../types/matchers';
import * as types from './types';
import { registerMusterType } from './types-registry';

export const context: Matcher<Context> = createMatcher('context', isContext);
registerMusterType('context', {
  deserialize: () => context,
});

export const scope: Matcher<Scope> = createMatcher('scope', isScope);
registerMusterType('scope', {
  deserialize: () => scope,
});

export const nodeType: Matcher<NodeType> = createMatcher('nodeType', isNodeType);
registerMusterType('nodeType', {
  deserialize: () => nodeType,
});

export const nodeDefinition: Matcher<NodeDefinition> = createMatcher(
  'nodeDefinition',
  isNodeDefinition,
);
registerMusterType('nodeDefinition', {
  deserialize: () => nodeDefinition,
});

export const graphNode: Matcher<GraphNode> = createMatcher('graphNode', isGraphNode);
registerMusterType('graphNode', {
  deserialize: () => graphNode,
});

export const nodeDependency: Matcher<NodeDependency> = types.shape({
  allowErrors: types.optional(types.bool),
  allowPending: types.optional(types.bool),
  acceptNil: types.optional(types.bool),
  until: types.optional(
    types.shape({
      predicate: types.func,
      errorMessage: types.optional(types.func),
    }),
  ),
  once: types.optional(types.bool),
  invalidate: types.optional(types.bool),
  target: types.oneOfType([nodeDefinition, graphNode]),
});

export const operationType: Matcher<OperationType> = createMatcher(
  'operationType',
  isOperationType,
);
registerMusterType('operationType', {
  deserialize: () => operationType,
});

export const graphOperation: Matcher<GraphOperation> = createMatcher(
  'graphOperation',
  isGraphOperation,
);
registerMusterType('graphOperation', {
  deserialize: () => graphOperation,
});

export const graphAction: Matcher<GraphAction> = createMatcher('graphAction', isGraphAction);
registerMusterType('graphAction', {
  deserialize: () => graphAction,
});

export const event: Matcher<MusterEvent> = createMatcher('event', isEvent);
registerMusterType('event', {
  deserialize: () => event,
});

export const proxiedNode: Matcher<ProxiedNode> = createMatcher('proxiedNode', isProxiedNode);
registerMusterType('proxiedNode', {
  deserialize: () => proxiedNode,
});
