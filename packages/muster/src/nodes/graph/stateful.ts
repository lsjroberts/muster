import { BehaviorSubject, ObservableLike, Subscription } from '@dws/muster-observable';
import {
  GraphNode,
  isGraphNode,
  NodeDefinition,
  NodeExecutionContext,
  StatefulGraphNode,
  StatefulNodeType,
} from '../../types/graph';
import createNodeDefinition from '../../utils/create-node-definition';
import { createNodeType } from '../../utils/create-node-type';
import * as graphTypes from '../../utils/graph-types';
import * as types from '../../utils/types';
import { pending } from './pending';
import { toValue } from './value';

/**
 * An instance of the [[stateful]] node.
 * See the [[stateful]] documentation to find out more.
 */
export interface ExternalStatefulNode<V>
  extends StatefulGraphNode<
      'stateful',
      ExternalStatefulNodeProperties<V>,
      ExternalStatefulNodeState,
      ExternalStatefulNodeData
    > {}

/**
 * A definition of the [[stateful]] node.
 * See the [[stateful]] documentation to find out more.
 */
export interface ExternalStatefulNodeDefinition<V>
  extends NodeDefinition<
      'stateful',
      ExternalStatefulNodeProperties<V>,
      ExternalStatefulNodeState,
      ExternalStatefulNodeData
    > {
  update(value: V): void;
}

export interface ExternalStatefulNodeProperties<V> {
  valueStream: ObservableLike<V>;
}

export interface ExternalStatefulNodeState {
  currentValue: NodeDefinition | GraphNode;
}

export interface ExternalStatefulNodeData {
  subscription: Subscription | undefined;
}

/**
 * The implementation of the [[stateful]] node.
 * See the [[stateful]] documentation to learn more.
 */
export const ExternalStatefulNodeType: StatefulNodeType<
  'stateful',
  ExternalStatefulNodeProperties<any>,
  ExternalStatefulNodeState
> = createNodeType<'stateful', ExternalStatefulNodeProperties<any>, ExternalStatefulNodeState>(
  'stateful',
  {
    state: {
      currentValue: types.oneOfType([graphTypes.nodeDefinition, graphTypes.graphNode]),
    },
    shape: {
      valueStream: types.saveHash(types.any),
    },
    getInitialState(): ExternalStatefulNodeState {
      return {
        currentValue: pending(),
      };
    },
    serialize: false,
    deserialize: false,
    operations: {
      evaluate: {
        run(
          node: ExternalStatefulNode<any>,
          options: never,
          dependencies: Array<never>,
          context: Array<never>,
          state: ExternalStatefulNodeState,
        ): NodeDefinition | GraphNode {
          return state.currentValue;
        },
        onSubscribe(
          this: NodeExecutionContext<ExternalStatefulNodeState, ExternalStatefulNodeData>,
          node: ExternalStatefulNode<any>,
        ): void {
          const subscription = node.definition.properties.valueStream.subscribe((v) => {
            this.setState((s) => ({
              ...s,
              currentValue: isGraphNode(v) ? v : toValue(v),
            }));
          });
          this.setData({
            subscription,
          });
        },
        onUnsubscribe(
          this: NodeExecutionContext<ExternalStatefulNodeState, ExternalStatefulNodeData>,
        ): void {
          const subscription = this.getData().subscription;
          subscription && subscription.unsubscribe();
        },
      },
    },
  },
);

/**
 * Creates a new instance of a [[stateful]] node, which is useful when you need to create a graph node that can be changed
 * from outside Muster. It works in the same way as a [[fromStream]] with the
 * `BehaviourSubject` from RxJS.
 *
 *
 * @example **Simple stateful node**
 * ```ts
 * import muster, { computed, ref, stateful } from '@dws/muster';
 *
 * const isOffline = stateful(false);
 * const app = muster({
 *   isOffline,
 *   status: computed([ref('isOffline')], (isOffline) =>
 *     isOffline ? 'Offline' : 'Online',
 *   ),
 * });
 *
 * app.resolve(ref('status')).subscribe((status) => {
 *   console.log(status);
 * });
 *
 * console.log('Changing isOffline to true');
 * isOffline.update(true);
 *
 * // Console output:
 * // Online
 * // Changing isOffline to true
 * // Offline
 * ```
 * This example shows how to use a [[stateful]] to send values to Muster.
 */
export function stateful<V>(initialValue: V): ExternalStatefulNodeDefinition<V> {
  const valueStream = new BehaviorSubject<V>(initialValue);
  return Object.assign(
    createNodeDefinition(ExternalStatefulNodeType, {
      valueStream: valueStream as ObservableLike<V>,
    }),
    {
      update(value: V): void {
        valueStream.next(value);
      },
    },
  );
}

export function isStatefulNodeDefinition(
  value: NodeDefinition,
): value is ExternalStatefulNodeDefinition<any> {
  return value.type === ExternalStatefulNodeType;
}
