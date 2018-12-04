import { Params } from '../../types';
import {
  MusterEvent,
  NodeDefinition,
  NodeLike,
  StatefulGraphNode,
  StatefulNodeDefinition,
  StatefulNodeType,
} from '../../types/graph';
import createNodeDefinition from '../../utils/create-node-definition';
import { createNodeType } from '../../utils/create-node-type';
import * as graphTypes from '../../utils/graph-types';
import { toNode } from '../../utils/to-node';
import * as types from '../../utils/types';
import withScopeFrom from '../../utils/with-scope-from';

/**
 * An instance of the [[invalidateOn]] node.
 * See the [[invalidateOn]] documentation to find out more.
 */
export interface InvalidateOnNode
  extends StatefulGraphNode<
      'invalidate-on',
      InvalidateOnNodeProperties,
      InvalidateOnNodeState,
      InvalidateOnNodeData
    > {}

/**
 * A definition of the [[invalidateOn]] node.
 * See the [[invalidateOn]] documentation to find out more.
 */
export interface InvalidateOnNodeDefinition
  extends StatefulNodeDefinition<
      'invalidate-on',
      InvalidateOnNodeProperties,
      InvalidateOnNodeState,
      InvalidateOnNodeData
    > {}

export type InvalidateOnNodeCallback = (
  event: MusterEvent,
  props: Params,
) => NodeDefinition | undefined;

export interface InvalidateOnNodeProperties {
  target: NodeDefinition;
  predicate: (event: MusterEvent) => boolean;
}

export interface InvalidateOnNodeState {}

export interface InvalidateOnNodeData {
  subscription: () => void;
}

/**
 * The implementation of the [[invalidateOn]].
 * See the [[invalidateOn]] to learn more.
 */
export const InvalidateOnNodeType: StatefulNodeType<
  'invalidate-on',
  InvalidateOnNodeProperties,
  InvalidateOnNodeState
> = createNodeType<'invalidate-on', InvalidateOnNodeProperties, InvalidateOnNodeState>(
  'invalidate-on',
  {
    state: {},
    shape: {
      target: graphTypes.nodeDefinition,
      predicate: types.saveHash(types.func),
    },
    getInitialState(): InvalidateOnNodeState {
      return {};
    },
    operations: {
      evaluate: {
        run(node: InvalidateOnNode): NodeDefinition {
          const { target } = node.definition.properties;
          return target;
        },
        onSubscribe(node: InvalidateOnNode) {
          const { predicate, target } = node.definition.properties;
          const { subscription: disposeSubscription } = this.getData();
          disposeSubscription && disposeSubscription();
          const subscription = node.scope.events.listen((event) => {
            if (!predicate(event)) return;
            const targetNode = withScopeFrom(node, target);
            node.scope.store.invalidate(targetNode);
          });
          this.setData({
            subscription,
          });
        },
        onUnsubscribe() {
          const { subscription: disposeSubscription } = this.getData();
          disposeSubscription && disposeSubscription();
        },
      },
    },
  },
);

export type AcceptedPredicateTypes =
  | InvalidateOnNodeProperties['predicate']
  | MusterEvent['type']
  | Array<MusterEvent['type']>;

/**
 * Creates a new instance of an [[invalidateOn]] node, which is a type of [[NodeDefinition]] used to trigger
 * the invalidation mechanism. Invalidation causes the target node to lose its value and forces a re-fetch of it.
 * This is particularly useful for nodes like [[fromPromise]] or [[computed]] that can change the value depending on some
 * external factors e.g. calling an API endpoint or some local variable in the code (which is not recommended).
 *
 * It works similarly to the [[invalidate]] with the difference being the mechanism triggering
 * the invalidation. The [[invalidate]] causes invalidation when resolved; [[invalidateOn]]
 * causes invalidation upon dispatching a specific Muster event. See the [[dispatch]] to learn
 * more about dispatching Muster events.
 *
 * The predicate for the [[invalidateOn]] can be defined as:
 * - the type of the triggered event to respond to
 * - an array of triggered event types to respond to
 * - a function that takes [[EventData]] and returns a boolean
 *
 *
 * @example **Invalidating on event**
 * ```ts
 * import muster, { dispatch, fromPromise, invalidateOn, ref } from '@dws/muster';
 *
 * const externalNumbers = [1, 2, 3];
 *
 * const app = muster({
 *   numbers: invalidateOn(
 *     'invalidate-numbers',
 *     fromPromise(() => Promise.resolve(externalNumbers)),
 *   ),
 * });
 *
 * app.resolve(ref('numbers')).subscribe((numbers) => {
 *   console.log(numbers);
 * });
 *
 * console.log('Adding `4` to numbers`');
 * externalNumbers.push(4);
 *
 * console.log('Dispatching the `invalidate-numbers` event');
 * await app.resolve(dispatch('invalidate-numbers'));
 *
 * // Console output:
 * // [1, 2, 3]
 * // Adding `4` to numbers`
 * // Dispatching the `invalidate-numbers` event
 * // [1, 2, 3, 4]
 * ```
 * This example shows how to use the [[invalidateOn]] to invalidate a part of the graph when
 * a particular event is triggered.
 */
export function invalidateOn(
  predicate: AcceptedPredicateTypes,
  target: NodeLike,
): InvalidateOnNodeDefinition {
  return createNodeDefinition(InvalidateOnNodeType, {
    predicate: createPredicateFunction(predicate),
    target: toNode(target),
  });
}

export function isInvalidateOnNodeDefinition(
  value: NodeDefinition,
): value is InvalidateOnNodeDefinition {
  return value.type === InvalidateOnNodeType;
}

function createPredicateFunction(
  events: AcceptedPredicateTypes,
): InvalidateOnNodeProperties['predicate'] {
  if (typeof events === 'function') return events;
  if (typeof events === 'string' || typeof events === 'symbol') {
    return (event) => event.type === events;
  }
  return (event) => events.includes(event.type);
}
