import mapValues from 'lodash/mapValues';
import {
  Context,
  ContextName,
  GraphNode,
  isGraphNode,
  isNodeDefinition,
  MusterEvent,
  NodeDefinition,
  NodeExecutionContext,
  NodeLike,
  Scope,
  StatefulGraphNode,
  StatefulNodeDefinition,
  StatefulNodeType,
} from '../../types/graph';
import { createRootContext } from '../../utils/create-context';
import createGraphNode from '../../utils/create-graph-node';
import createNodeDefinition from '../../utils/create-node-definition';
import { createNodeType } from '../../utils/create-node-type';
import { createChildScope } from '../../utils/create-scope';
import * as graphTypes from '../../utils/graph-types';
import { toNode } from '../../utils/to-node';
import * as types from '../../utils/types';
import withScopeFrom from '../../utils/with-scope-from';
import { getPath, PARENT_SCOPE_PATH_KEY } from './get';
import { ROOT_CONTEXT_NAME } from './root';
import { value } from './value';

/**
 * An instance of the [[scope]] node.
 * See the [[scope]] documentation to find out more.
 */
export interface ScopeNode
  extends StatefulGraphNode<'scope', ScopeNodeProperties, ScopeNodeState, ScopeNodeData> {}

/**
 * A definition of the [[scope]] node.
 * See the [[scope]] documentation to find out more.
 */
export interface ScopeNodeDefinition
  extends StatefulNodeDefinition<'scope', ScopeNodeProperties, ScopeNodeState, ScopeNodeData> {
  readonly activeScopes: Array<Scope>;
  dispose(): void;
}

export type EventRedispatcher = ((event: MusterEvent) => MusterEvent | undefined);

export interface ScopeNodeProperties {
  context: { [key in ContextName]: GraphNode | NodeDefinition } | undefined;
  root: NodeDefinition;
  redispatch: EventRedispatcher | true | undefined;
}

export interface ScopeNodeState {
  scope: Scope | undefined;
  context: Context | undefined;
}

export interface ScopeNodeData {}

/**
 * The implementation of the [[scope]] node.
 * See the [[scope]] documentation to learn more.
 */
export const ScopeNodeType: StatefulNodeType<
  'scope',
  ScopeNodeProperties,
  ScopeNodeState,
  ScopeNodeData
> = createNodeType<'scope', ScopeNodeProperties, ScopeNodeState, ScopeNodeData>('scope', {
  shape: {
    context: types.optional(
      types.objectOf(
        types.oneOfType<NodeDefinition | GraphNode>([
          graphTypes.nodeDefinition,
          graphTypes.graphNode,
        ]),
      ),
    ),
    root: graphTypes.nodeDefinition,
    redispatch: types.optional(types.oneOfType([types.saveHash(types.func), types.bool])),
  },
  state: {
    scope: types.optional(graphTypes.scope),
    context: types.optional(graphTypes.context),
  },
  getInitialState() {
    return {
      scope: undefined,
      context: undefined,
    };
  },
  onSubscribe(this: NodeExecutionContext<ScopeNodeState, ScopeNodeData>, node: ScopeNode): void {
    const { root, context, redispatch } = node.definition.properties;
    const childScope = createChildScope(node.scope, {
      redispatch,
      onSubscribe: () => this.retain(),
      onUnsubscribe: () => this.release(),
    });
    const childContext = createRootContext({
      ...(context &&
        mapValues(context, (contextValue) =>
          isGraphNode(contextValue) ? contextValue : withScopeFrom(node, contextValue),
        )),
      [PARENT_SCOPE_PATH_KEY]: withScopeFrom(node, value(getPath(node.context))),
    });
    // TODO: Remove the `as any` cast once https://github.com/Microsoft/TypeScript/issues/1863 is resolved
    childContext.values[ROOT_CONTEXT_NAME as any] = createGraphNode(childScope, childContext, root);
    this.setState(
      (prevState): ScopeNodeState => ({
        ...prevState,
        scope: childScope,
        context: childContext,
      }),
    );
    const scopeDefinition = node.definition as ScopeNodeDefinition;
    scopeDefinition.activeScopes.push(childScope);
  },
  onUnsubscribe(this: NodeExecutionContext<ScopeNodeState, ScopeNodeData>, node: ScopeNode): void {
    const { scope } = this.getState();
    if (!scope) {
      return;
    }
    const scopeDefinition = node.definition as ScopeNodeDefinition;
    const scopeIndex = scopeDefinition.activeScopes.indexOf(scope);
    if (scopeIndex !== -1) {
      scopeDefinition.activeScopes.splice(scopeIndex, 1);
    }
  },
  operations: {
    evaluate: {
      run(
        node: ScopeNode,
        options: never,
        dependencies: Array<never>,
        contextDependencies: Array<never>,
        state: ScopeNodeState,
      ): NodeDefinition | GraphNode {
        const { root } = node.definition.properties;
        const { scope, context } = state;
        return createGraphNode(scope!, context!, root);
      },
    },
  },
});

/**
 * Creates a new instance of a [[scope]] node, which is used when to isolate part of the muster graph
 * from the rest. The nodes from a scope are still accessible from the parent scope,
 * but the nodes from within the scope have no way of accessing anything from the parent scope.
 * By default, the [[scope]] also isolates the scope from external events and prevents
 * the events dispatched in this scope leaving it. The behaviour of isolating scope from events
 * dispatched in the parent scope can be overwritten with the help of the `redispatch` property.
 * See the [[dispatch]] to learn more about event dispatching and how to configure the event
 * re-dispatching.
 *
 * Nodes living in the [[scope]] have no access to the nodes from the parent scope so any
 * dependencies must be injected to the scope as part of the context definition.
 *
 *
 * @example **Simple scope**
 * ```js
 * import muster, { ref, scope } from '@dws/muster';
 *
 * const app = muster({
 *   nested: scope({
 *     value: 'Hello world',
 *   }),
 * });
 *
 * const result = await app.resolve(ref('nested', 'value'));
 * // result === 'Hello world'
 * ```
 * This example shows how to create a very simple [[scope]] with a single branch containing a
 * `value` leaf. This leaf can be accessed in the same way as if the scope was a normal branch.
 *
 *
 * @example **References inside of the scope**
 * ```js
 * import muster, { ref, scope } from '@dws/muster';
 *
 * const app = muster({
 *   greeting: 'Hello, world',
 *   nested: scope({
 *     greeting: 'Hello, Bob',
 *     refToGreeting: ref('greeting'),
 *   }),
 * });
 *
 * const result = await app.resolve(ref('nested', 'greeting'));
 * // result === 'Hello, Bob'
 * ```
 * This example shows how addressing changes within a given scope. Normally, the
 * `ref('greeting')` would have returned a `value('Hello, world')` but a [[scope]] changes
 * the root of the graph. This means that any reference within a [[scope]] can reference only
 * the paths defined within a given scope.
 *
 *
 * @example **Injecting nodes to a scope**
 * ```js
 * import muster, { context, ref, scope } from '@dws/muster';
 *
 * const app = muster({
 *   greeting: 'Hello, world',
 *   nested: scope({
 *     greeting: context('message'),
 *   }, {
 *     message: ref('greeting'),
 *   }),
 * });
 *
 * const result = await app.resolve(ref('nested', 'greeting'));
 * // result === 'Hello, world'
 * ```
 * In order to be able to use nodes from outside a given scope you have to inject them to the
 * [[scope]] at creation time. These nodes can then be accessed from the context with
 * the use of the [[context]].
 */
export function scope(
  root: NodeDefinition | NodeLike,
  context?: { [key in ContextName]: GraphNode | NodeDefinition | NodeLike },
  redispatch?: EventRedispatcher | true,
): ScopeNodeDefinition {
  const instance = createNodeDefinition(ScopeNodeType, {
    root: isNodeDefinition(root) ? root : toNode(root),
    context: mapValues(context, (contextValue) =>
      isNodeDefinition(contextValue) || isGraphNode(contextValue)
        ? contextValue
        : toNode(contextValue),
    ),
    redispatch,
  } as ScopeNodeProperties);
  return Object.assign(instance, {
    activeScopes: [] as Array<Scope>,
    dispose() {
      const activeScopes = this.activeScopes;
      activeScopes.forEach((scope) => scope.store.disposeScope(scope));
      this.activeScopes.length = 0;
    },
  });
}

export function isScopeNodeDefinition(value: NodeDefinition): value is ScopeNodeDefinition {
  return value.type === ScopeNodeType;
}
