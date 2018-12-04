import {
  isNodeDefinition,
  MusterEvent,
  NodeDefinition,
  NodeExecutionContext,
  NodeLike,
  Params,
  StatefulGraphNode,
  StatefulNodeDefinition,
  StatefulNodeType,
} from '../../types/graph';
import createNodeDefinition from '../../utils/create-node-definition';
import { createNodeType } from '../../utils/create-node-type';
import * as graphTypes from '../../utils/graph-types';
import { toNode } from '../../utils/to-node';
import * as types from '../../utils/types';
import { ok } from './ok';
import { getParams } from './tree';

/**
 * An instance of the [[on]] node.
 * See the [[on]] documentation to find out more.
 */
export interface OnNode
  extends StatefulGraphNode<'on', OnNodeProperties, OnNodeState, OnNodeData> {}

/**
 * A definition of the [[on]] node.
 * See the [[on]] documentation to find out more
 */
export interface OnNodeDefinition
  extends StatefulNodeDefinition<'on', OnNodeProperties, OnNodeState, OnNodeData> {}

export type OnNodeCallback = (event: MusterEvent, props: Params) => NodeDefinition | undefined;

export interface OnNodeProperties {
  initialValue: NodeDefinition;
  callback: OnNodeCallback;
}

export interface OnNodeState {
  currentValue: NodeDefinition | undefined;
}

export interface OnNodeData {
  subscription: () => void;
}

/**
 * The implementation of the [[on]] node.
 * See the [[on]] documentation to find out more.
 */
export const OnNodeType: StatefulNodeType<'on', OnNodeProperties, OnNodeState> = createNodeType<
  'on',
  OnNodeProperties,
  OnNodeState
>('on', {
  state: {
    currentValue: types.optional(graphTypes.nodeDefinition),
  },
  shape: {
    initialValue: graphTypes.nodeDefinition,
    callback: types.saveHash(types.func),
  },
  getInitialState(): OnNodeState {
    return {
      currentValue: undefined,
    };
  },
  operations: {
    evaluate: {
      run(
        node: OnNode,
        options: never,
        dependencies: Array<never>,
        context: Array<never>,
        state: OnNodeState,
      ): NodeDefinition {
        const { currentValue } = state;
        return currentValue || node.definition.properties.initialValue;
      },
      onSubscribe(node: OnNode) {
        const { callback } = node.definition.properties;
        const { subscription: existingSubscription } = this.getData();
        if (existingSubscription) {
          existingSubscription();
        }
        const subscription = node.scope.events.listen((event) => {
          const updatedValue = callback(event, getParams(node.context));
          if (updatedValue) {
            this.setState((prevState) => ({
              ...prevState,
              currentValue: updatedValue,
            }));
          }
        });
        this.setData({
          subscription,
        });
      },
      onUnsubscribe(node: OnNode) {
        const { subscription: existingSubscription } = this.getData();
        if (existingSubscription) {
          existingSubscription();
        }
      },
    },
    reset: {
      run(
        node: OnNode,
        options: never,
        dependencies: Array<never>,
        context: Array<never>,
        state: OnNodeState,
      ): NodeDefinition {
        return ok();
      },
      onSubscribe(this: NodeExecutionContext<OnNodeState, OnNodeData>, node: OnNode): void {
        const { currentValue: previousValue } = this.getState();
        if (!previousValue) {
          return;
        }
        this.setState((prevState) => ({
          ...prevState,
          currentValue: undefined,
        }));
      },
    },
  },
});

/**
 * Creates a new instance of an [[on]] node, which is a type of [[NodeDefinition]] which can react to the dispatched
 * Muster events. The node starts its lifecycle by emitting the `initialValue`.
 * This value can then be changed by the `callback` when a correct event has arrived. See the [[dispatch]]
 * documentation to learn more about dispatching events.
 *
 *
 * @example **Change the value on event**
 * ```ts
 * import muster, { dispatch, on, ref, value } from '@dws/muster';
 *
 * const app = muster({
 *   isOnline: on((event) => {
 *     if (event.type === 'online') return value(true);
 *     if (event.type === 'offline') return value(false);
 *     return undefined;
 *   }, true),
 * });
 *
 * app.resolve(ref('isOnline')).subscribe((isOnline) => {
 *   console.log(isOnline ? 'Online' : 'Offline');
 * });
 *
 * console.log('Dispatching `offline` event');
 * await app.resolve(dispatch('offline'));
 *
 * // Console output:
 * // Online
 * // Dispatching `offline` event
 * // Offline
 * ```
 */
export function on(
  callback: ((event: MusterEvent, params: Params) => NodeDefinition | NodeLike | undefined),
  initialValue: NodeDefinition | NodeLike,
): OnNodeDefinition {
  const wrappedCallback = (event: MusterEvent, params: Params) => {
    const updatedValue = callback(event, params);
    if (updatedValue === undefined) {
      return updatedValue;
    }
    return isNodeDefinition(updatedValue) ? updatedValue : toNode(updatedValue);
  };
  return createNodeDefinition(OnNodeType, {
    callback: wrappedCallback,
    initialValue: isNodeDefinition(initialValue) ? initialValue : toNode(initialValue),
  });
}

export function isOnNodeDefinition(value: NodeDefinition): value is OnNodeDefinition {
  return value.type === OnNodeType;
}
