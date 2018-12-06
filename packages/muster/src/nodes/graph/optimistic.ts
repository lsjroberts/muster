import omit from 'lodash/omit';
import { resolveOperation } from '../../operations/resolve';
import { SetOperation } from '../../operations/set';
import {
  DisposeCallback,
  GraphNode,
  NodeDefinition,
  NodeExecutionContext,
  StatefulGraphNode,
  StatefulNodeDefinition,
  StatefulNodeType,
} from '../../types/graph';
import createNodeDefinition from '../../utils/create-node-definition';
import { createNodeType } from '../../utils/create-node-type';
import * as graphTypes from '../../utils/graph-types';
import * as types from '../../utils/types';
import withScopeFrom from '../../utils/with-scope-from';
import { ErrorNodeType } from './error';
import { ok } from './ok';
import { PendingNodeType } from './pending';
import { set } from './set';
import { value } from './value';

/**
 * An instance of the [[optimistic]] node.
 * See the [[optimistic]] documentation to find out more.
 */
export interface OptimisticNode extends StatefulGraphNode<'optimistic', OptimisticNodeProperties> {}

/**
 * A definition of the [[optimistic]] node.
 * See the [[optimistic]] documentation to find out more.
 */
export interface OptimisticNodeDefinition
  extends StatefulNodeDefinition<'optimistic', OptimisticNodeProperties> {}

export interface OptimisticNodeProperties {
  target: NodeDefinition;
}

export interface OptimisticNodeState {
  pendingSetOperations: Array<string>;
  setResults: { [operationId: string]: GraphNode };
  value: GraphNode | undefined;
}

export interface OptimisticNodeData {
  setSubscriptions: { [operationId: string]: DisposeCallback };
}

/**
 * The implementation of the [[optimistic]] node.
 * See the [[optimistic]] documentation to learn more.
 */
export const OptimisticNodeType: StatefulNodeType<
  'optimistic',
  OptimisticNodeProperties
> = createNodeType<'optimistic', OptimisticNodeProperties>('optimistic', {
  shape: {
    target: graphTypes.nodeDefinition,
  },
  state: {
    pendingSetOperations: types.arrayOf(types.string),
    setResults: types.objectOf(graphTypes.graphNode),
    value: types.optional(graphTypes.graphNode),
  },
  getInitialState(): OptimisticNodeState {
    return {
      pendingSetOperations: [],
      setResults: {},
      value: undefined,
    };
  },
  operations: {
    evaluate: {
      run(
        node: OptimisticNode,
        operation: never,
        dependencies: never,
        context: never,
        state: OptimisticNodeState,
      ): GraphNode | NodeDefinition {
        return state.value || node.definition.properties.target;
      },
    },
    isUpdating: {
      run(
        node: OptimisticNode,
        operation: never,
        dependencies: never,
        context: never,
        state: OptimisticNodeState,
      ): NodeDefinition {
        return value(state.pendingSetOperations.length > 0);
      },
    },
    set: {
      run(
        node: OptimisticNode,
        operation: SetOperation,
        dependencies: never,
        context: never,
        state: OptimisticNodeState,
      ): GraphNode {
        return state.setResults[operation.id];
      },
      onSubscribe(
        this: NodeExecutionContext<OptimisticNodeState, OptimisticNodeData>,
        node: OptimisticNode,
        operation: SetOperation,
      ): void {
        const { target } = node.definition.properties;
        const nodeToResolve = withScopeFrom(node, set(target, operation.properties.value));
        this.setState((state) => ({
          ...state,
          pendingSetOperations: [...state.pendingSetOperations, operation.id],
          setResults: {
            ...state.setResults,
            [operation.id]: withScopeFrom(node, ok()),
          },
          value: withScopeFrom(node, operation.properties.value),
        }));
        const unsubscribe = node.scope.store.subscribe(
          nodeToResolve,
          resolveOperation(),
          (value) => {
            if (PendingNodeType.is(value)) return;
            this.setState((state) => ({
              ...state,
              pendingSetOperations: state.pendingSetOperations.filter((id) => id !== operation.id),
              setResults: ErrorNodeType.is(value)
                ? {
                    ...state.setResults,
                    [operation.id]: value,
                  }
                : state.setResults,
              value: ErrorNodeType.is(value) ? undefined : value,
            }));
          },
        );
        this.setData((data) => ({
          ...data,
          setSubscriptions: {
            ...data.setSubscriptions,
            [operation.id]: unsubscribe,
          },
        }));
      },
      onUnsubscribe(
        this: NodeExecutionContext<OptimisticNodeState, OptimisticNodeData>,
        node: OptimisticNode,
        operation: SetOperation,
      ): void {
        const unsubscribe = this.getData().setSubscriptions![operation.id];
        unsubscribe();
        this.setData((data) => ({
          ...data,
          setSubscriptions: omit(data.setSubscriptions, operation.id),
        }));
        this.setState((state) => ({
          ...state,
          pendingSetOperations: state.pendingSetOperations.filter((id) => id !== operation.id),
          setResults: omit(state.setResults, operation.id),
        }));
      },
    },
  },
});

/**
 * Creates a new instance of the [[optimistic]] node. This node can be used to make an asynchronously
 * settable node behave in a synchronous way by pretending that the set operation was synchronous,
 * and by serving that value as a result of evaluate operation.
 *
 *
 * @example **Wrap fromPromise in optimistic**
 * ```js
 * import muster, { fromPromise, ok, optimistic, ref, set, value } from '@dws/muster';
 *
 * const app = muster({
 *   userPreferences: optimistic(fromPromise({
 *     get: () => fetch('http://api.yourproject.com/user/preferences').then((result) => {
 *       console.log('Data loaded from the server');
 *       return result;
 *     }),
 *     set: (params, value) => fetch('http://api.yourproject.com/user/preferences', {
 *       body: JSON.stringify(value),
 *       method: 'POST',
 *     }).then((result) => {
 *       console.log('Data saved on the server');
 *       return ok();
 *     }),
 *   })),
 * });
 *
 * console.log('Subscribing to userPreferences');
 * let isFirstTime = true;
 * app.resolve(ref('userPreferences')).subscribe((preferences) => {
 *   console.log('User preferences:', preferences);
 *   if (!isFirstTime) return;
 *   isFirstTime = false;
 *   console.log('Changing user preferences');
 *   app.resolve(set('userPreferences', value({ likeMuster: true }))).then(() => {});
 * });
 *
 * // Console output:
 * // Subscribing to userPreferences
 * // Data loaded from the server
 * // User preferences: { likeMuster: false }
 * // Changing user preferences
 * // User preferences: { likeMuster: true }
 * // Data saved on the server
 * ```
 * Note that the `userPreferences` emitted before the set was completed. This is because
 * the `optimistic` node assumes that the `set` operation will be successful, and immediately updates
 * the `evaluate` operation output.
 */
export function optimistic(target: NodeDefinition): OptimisticNodeDefinition {
  return createNodeDefinition(OptimisticNodeType, { target });
}

export function isOptimisticNodeDefinition(
  optimistic: NodeDefinition,
): optimistic is OptimisticNodeDefinition {
  return optimistic.type === OptimisticNodeType;
}
