import {
  MusterEvent,
  MusterEventName,
  NodeDefinition,
  StatelessGraphNode,
  StatelessNodeDefinition,
  StatelessNodeType,
} from '../../types/graph';
import createNodeDefinition from '../../utils/create-node-definition';
import { createNodeType } from '../../utils/create-node-type';
import * as graphTypes from '../../utils/graph-types';
import { ok } from './ok';

/**
 * An instance of the [[dispatch]] node.
 * See the [[dispatch]] documentation to find out more.
 */
export interface DispatchNode extends StatelessGraphNode<'dispatch', DispatchNodeProperties> {}

/**
 * A definition of the [[dispatch]] node.
 * See the [[dispatch]] documentation to find out more.
 */
export interface DispatchNodeDefinition
  extends StatelessNodeDefinition<'dispatch', DispatchNodeProperties> {}

export interface DispatchNodeProperties {
  event: MusterEvent;
}

/**
 * The implementation of the [[dispatch]].
 * See the [[dispatch]] documentation to learn more.
 */
export const DispatchNodeType: StatelessNodeType<
  'dispatch',
  DispatchNodeProperties
> = createNodeType<'dispatch', DispatchNodeProperties>('dispatch', {
  shape: {
    event: graphTypes.event,
  },
  operations: {
    evaluate: {
      cacheable: false,
      run(node: DispatchNode): NodeDefinition {
        const { event } = node.definition.properties;
        node.scope.events.emit(event);
        return ok();
      },
    },
  },
});

/**
 * Creates a new instance of a [[dispatch]] node, which is a type of [[NodeDefinition]] used to dispatch a Muster event.
 * The event consists of type (which can be a string or a symbol) and an optional payload. The dispatched event can be received
 * by any [[NodeDefinition]] in a particular scope. By default, events do not cross scope boundaries.
 * See the [[scope]] documentation to learn more about scopes and how to re-dispatch events to a different scope.
 *
 * Out of the box, Muster comes with two graph nodes that use events dispatched by the [[dispatch]]:
 * - [[invalidateOn]]
 * - [[on]]
 *
 * Additionally, each [[NodeType]] can implement its own way of handling events.
 *
 *
 * @example **Dispatching an event**
 * ```js
 * import muster, { dispatch, on, ref, value } from '@dws/muster';
 *
 * const app = muster({
 *   isOnline: on((event) => {
 *     if (event.type === 'online') {
 *       console.log('Received the `online` event');
 *       return value(true);
 *     }
 *     if (event.type === 'offline') {
 *       console.log('Received the `offline` event');
 *       return value(false);
 *     }
 *     return undefined;
 *   }, true),
 * });
 *
 * app.resolve(ref('isOnline')).subscribe((isOnline) => {
 *   console.log(isOnline ? "Online" : "Offline");
 * });
 *
 * console.log('Dispatch offline');
 * await app.resolve(dispatch('offline'));
 *
 * console.log('Dispatch online');
 * await app.resolve(dispatch('online'));
 *
 * // Console output
 * // Online
 * // Dispatch offline
 * // Offline
 * // Dispatch online
 * // Online
 * ```
 * This example shows how to use the [[dispatch]] to dispatch muster events.
 *
 *
 * @example **Scope limited event dispatching**
 * ```js
 * import muster, { dispatch, key, on, query, root, scope, value } from '@dws/muster';
 *
 * const app = muster({
 *   listener: on((event) => {
 *     if (event.type !== 'event-name') return;
 *     console.log('Received `event-name` in the root scope');
 *   }, 'initial'),
 *   innerScope: scope({
 *     listener: on((event) => {
 *       if (event.type !== 'event-name') return;
 *       console.log('Received `event-name` in the inner scope');
 *     }, 'initial inner'),
 *   }),
 * });
 *
 * // Subscribe to both root-scope listener and inner-scope listener
 * app.resolve(query(root(), {
 *   listener: key('listener'),
 *   innerScope: key('innerScope', {
 *     listener: key('listener'),
 *   }),
 * })).subscribe(() => {});
 *
 * console.log('Dispatching the event');
 * await app.resolve(dispatch('event-name'));
 *
 * // Console output:
 * // Dispatching the event
 * // Received `event-name` in the root scope
 * ```
 * This example shows that the events are locked to a single scope. By default, the events do not
 * cross the scope boundary. This behaviour can be selectively changed. Each scope can define
 * its own event re-dispatching policy.
 *
 *
 * @example **Re-dispatching events to child scopes**
 * ```js
 * import muster, { dispatch, key, on, query, root, scope } from '@dws/muster';
 *
 * const app = muster({
 *   listener: on((event) => {
 *     if (event.type === 'first-event') {
 *       console.log('Received `first-event` in the root scope');
 *     }
 *     if (event.type === 'second-event') {
 *       console.log('Received `second-event` in the root scope');
 *     }
 *   }, 'initial'),
 *   innerScope: scope({
 *     listener: on((event) => {
 *       if (event.type === 'first-event') {
 *         console.log('Received `first-event` in the inner scope');
 *       }
 *       if (event.type === 'second-event') {
 *         console.log('Received `second-event` in the inner scope');
 *       }
 *     }, 'initial inner'),
 *   }, {}, (event) => event.type === 'first-event' ? event : undefined),
 * });
 *
 * // Subscribe to both root-scope listener and inner-scope listener
 * app.resolve(query(root(), {
 *   listener: key('listener'),
 *   innerScope: key('innerScope', {
 *     listener: key('listener'),
 *   }),
 * })).subscribe(() => {});
 *
 * console.log('Dispatching the `first-event`');
 * await app.resolve(dispatch('first-event'));
 *
 * console.log('Dispatching the `second-event`');
 * await app.resolve(dispatch('second-event'));
 *
 * // Console output:
 * // Dispatching the `first-event`
 * // Received `first-event` in the root scope
 * // Received `first-event` in the inner scope
 * // Dispatching the `second-event`
 * // Received `second-event` in the root scope
 * ```
 * This example shows how to use the selective event re-dispatching. In this example only the events
 * with type 'first-event' are re-dispatched in the child scope. Optionally, instead of the function
 * you can just set the event re-dispatching to `true`. This means that every event should be
 * re-dispatched.
 */
export function dispatch(event: MusterEvent | MusterEventName): DispatchNodeDefinition {
  return createNodeDefinition(DispatchNodeType, {
    event: typeof event === 'string' ? { type: event, payload: undefined } : event,
  });
}

export function isDispatchNodeDefinition(value: NodeDefinition): value is DispatchNodeDefinition {
  return value.type === DispatchNodeType;
}
