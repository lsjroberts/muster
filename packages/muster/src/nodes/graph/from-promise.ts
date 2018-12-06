import { SetOperation } from '../../operations/set';
import {
  isNodeDefinition,
  NodeDefinition,
  NodeExecutionContext,
  NodeLike,
  Params,
  StatefulGraphNode,
  StatefulNodeType,
} from '../../types/graph';
import createNodeDefinition from '../../utils/create-node-definition';
import { createNodeType } from '../../utils/create-node-type';
import * as graphTypes from '../../utils/graph-types';
import * as types from '../../utils/types';
import { valueOf } from '../../utils/value-of';
import { error, ErrorNodeDefinition, isErrorNodeDefinition } from './error';
import { isOkNodeDefinition, ok, OkNodeDefinition } from './ok';
import { pending } from './pending';
import { getParams } from './tree';
import { toValue } from './value';

/**
 * An instance of the [[fromPromise]] node.
 * See the [[fromPromise]] documentation to find out more.
 */
export interface FromPromiseNode
  extends StatefulGraphNode<
      'fromPromise',
      FromPromiseNodeProperties,
      FromPromiseNodeState,
      FromPromiseNodeData
    > {}

/**
 * A definition of the [[fromPromise]] node.
 * See the [[fromPromise]] documentation to find out more.
 */
export interface FromPromiseNodeDefinition
  extends NodeDefinition<
      'fromPromise',
      FromPromiseNodeProperties,
      FromPromiseNodeState,
      FromPromiseNodeData
    > {}

export type GetterFactory = ((params: Params) => Promise<NodeDefinition | NodeLike>);
export type SetterFactory = ((
  params: Params,
  value: any,
) => Promise<OkNodeDefinition | ErrorNodeDefinition>);

export interface FromPromiseNodeProperties {
  get: GetterFactory | undefined;
  set: SetterFactory | undefined;
}

export interface FromPromiseNodeState {
  currentValue: NodeDefinition | undefined;
  pendingUpdate: Promise<NodeDefinition> | undefined;
  updateError: ErrorNodeDefinition | undefined;
}

export interface FromPromiseNodeData {
  isSubscribed: boolean;
  pendingGet: Promise<NodeDefinition> | undefined;
}

/**
 * Implementation of the [[fromPromise]].
 * See the [[fromPromise]] documentation for more information.
 */
export const FromPromiseNodeType: StatefulNodeType<
  'fromPromise',
  FromPromiseNodeProperties,
  FromPromiseNodeState
> = createNodeType<'fromPromise', FromPromiseNodeProperties, FromPromiseNodeState>('fromPromise', {
  serialize: false,
  deserialize: false,
  state: {
    currentValue: types.optional(graphTypes.nodeDefinition),
    pendingUpdate: types.optional(types.saveHash(types.any)),
    updateError: types.optional(graphTypes.nodeDefinition),
  },
  shape: {
    get: types.optional(types.saveHash(types.func)),
    set: types.optional(types.saveHash(types.func)),
  },
  getInitialState(): FromPromiseNodeState {
    return {
      currentValue: undefined,
      pendingUpdate: undefined,
      updateError: undefined,
    };
  },
  operations: {
    evaluate: {
      run(
        node: FromPromiseNode,
        options: never,
        dependencies: Array<never>,
        context: Array<never>,
        state: FromPromiseNodeState,
      ): NodeDefinition {
        const { get } = node.definition.properties;
        if (!get) {
          return error('Specified fromPromise node is write-only');
        }
        const { currentValue } = state;
        return currentValue || pending();
      },
      onInvalidate(
        this: NodeExecutionContext<FromPromiseNodeState, FromPromiseNodeData>,
        node: FromPromiseNode,
      ): void {
        this.setState((state) => ({
          ...state,
          currentValue: undefined,
          pendingUpdate: undefined,
          updateError: undefined,
        }));
        fetchValue(this, node);
      },
      onSubscribe(
        this: NodeExecutionContext<FromPromiseNodeState, FromPromiseNodeData>,
        node: FromPromiseNode,
      ): void {
        this.setData((data) => ({
          ...data,
          isSubscribed: true,
        }));
        fetchValue(this, node);
      },
      onUnsubscribe(this: NodeExecutionContext<FromPromiseNodeState, FromPromiseNodeData>): void {
        this.setData((data) => ({
          ...data,
          isSubscribed: false,
        }));
      },
    },
    set: {
      run(
        node: FromPromiseNode,
        options: never,
        dependencies: Array<never>,
        context: Array<never>,
        state: FromPromiseNodeState,
      ): NodeDefinition {
        const { set } = node.definition.properties;
        if (!set) {
          return error('Specified fromPromise node is read-only');
        }
        return state.pendingUpdate ? pending() : state.updateError || ok();
      },
      onSubscribe(
        this: NodeExecutionContext<FromPromiseNodeState, FromPromiseNodeData>,
        node: FromPromiseNode,
        operation: SetOperation,
      ): void {
        const { set } = node.definition.properties;
        if (!set) return;
        const { value: newValue } = operation.properties;
        const { currentValue: previousValue } = this.getState();
        if (!previousValue) {
          this.retain();
        }
        this.setData((data) => ({
          ...data,
          pendingGet: undefined,
        }));
        const pendingUpdate = Promise.resolve(set(getParams(node.context), valueOf(newValue)))
          .catch((e) => error(e))
          .then((result) => {
            if (this.getState().pendingUpdate !== pendingUpdate) return result;
            this.setState((state) => ({
              ...state,
              currentValue: isOkNodeDefinition(result) ? newValue : state.currentValue,
              pendingUpdate: undefined,
              updateError: isErrorNodeDefinition(result) ? result : undefined,
            }));
            return result;
          });
        this.setState((state) => ({
          ...state,
          pendingUpdate,
          updateError: undefined,
        }));
      },
    },
    reset: {
      run(): NodeDefinition {
        return ok();
      },
      onSubscribe(
        this: NodeExecutionContext<FromPromiseNodeState, FromPromiseNodeData>,
        node: FromPromiseNode,
      ) {
        const { currentValue: previousValue } = this.getState();
        if (previousValue) {
          this.release();
        }
        this.setState((state) => ({
          ...state,
          currentValue: undefined,
          pendingUpdate: undefined,
        }));
        const { isSubscribed } = this.getData();
        if (isSubscribed) {
          fetchValue(this, node);
        }
      },
    },
  },
});

/**
 * Creates a new instance of [[fromPromise]] node, which is a type of [[NodeDefinition]] useful when integrating asynchronous code with muster.
 * This node can be used when making API requests from within muster code. These requests may retrieve or update data
 * from a remote service.
 *
 * The [[fromPromise]] allows for handling `set` requests through a [set](_nodes_graph_set_.html#set).
 * See the "**Handling set requests**" example for more information.
 *
 *
 * @example **Basic promise node**
 * ```ts
 * import muster, { fromPromise, ref } from '@dws/muster';
 *
 * const app = muster({
 *   asyncName: fromPromise(() => Promise.resolve('async name')),
 * });
 *
 * // Resolving with 'await'
 * const awaitName = await app.resolve(ref('asyncName'));
 * // awaitName === 'async name'
 *
 * // Resolving with streams
 * let streamName = 'initial';
 * app.resolve(ref('asyncName')).subscribe((name) => {
 *   // name === 'async name'
 *   // streamName === 'initial'
 *   streamName = name;
 *   // streamName === 'async name'
 * });
 * // streamName === 'initial'
 * ```
 * This example demonstrates the asynchronous nature of [[fromPromise]]. When the ref is
 * requested with `await` it forces the code to wait for the [[fromPromise]] to emit a value.
 * Internally Muster requires every [[NodeDefinition]] to emit its value synchronously. To get around
 * that, [[fromPromise]] initially returns a [[pending]], then an updated value when the
 * promise resolves.
 *
 * The reason why in the example code the [[pending]] isn't emitted to the "outside
 * world" is that these values are internal to muster and are filtered out before returning the
 * response.
 *
 *
 * @example **Promise factory params**
 * ```js
 * import muster, { fromPromise, match, ref, tree, types, value } from '@dws/muster';
 *
 * const app = muster({
 *   user: {
 *     [match(types.string, 'id')]: fromPromise(({ id }) =>
 *       // You could make a request to an API endpoint here...
 *       Promise.resolve(tree({
 *         id: value(id),
 *         name: value(`User ${id}`),
 *       })),
 *     ),
 *   },
 * });
 *
 * const user1Name = await app.resolve(ref('user', '1', 'name'));
 * // user1Name === 'User 1'
 *
 * const user2Name = await app.resolve(ref('user', '2', 'name'));
 * // user2Name === 'User 2'
 * ```
 * This example demonstrates a real-world case of requesting user data based on their ID. Note the
 * promise factory in [[fromPromise]] receives a parameter with one field: `id`.
 *
 *
 * @example **Implementing set promise factory**
 * ```ts
 * import muster, { fromPromise, ref, set, tree } from '@dws/muster';
 *
 * const userSettings = {
 *   homepage: 'https://www.db.com',
 * };
 *
 * const app = muster({
 *   homepage: fromPromise({
 *     // Make an API request instead
 *     get: () => Promise.resolve(userSettings.homepage),
 *     // Make an API request instead
 *     set: (params, newValue) => new Promise((resolve) => {
 *       userSettings.homepage = newValue;
 *       resolve();
 *     }),
 *   }),
 * });
 *
 * let setTriggered = false;
 *
 * // Subscribe to the 'homepage'
 * console.log('Requesting homepage');
 * app.resolve(ref('homepage')).subscribe((homepage) => {
 *   console.log(`Homepage: ${homepage}`);
 *   !setTriggered && triggerSet();
 * });
 *
 * async function triggerSet() {
 *   setTriggered = true;
 *   console.log('Setting homepage');
 *   await app.resolve(set('homepage', 'https://wwww.github.com'));
 * }
 *
 * // Console output:
 * // Requesting homepage
 * // Homepage: https://www.db.com
 * // Setting homepage
 * // Homepage: https://www.github.com
 * ```
 */
export function fromPromise(
  definition: GetterFactory | { get?: GetterFactory; set?: SetterFactory },
  setFactory?: SetterFactory,
): FromPromiseNodeDefinition {
  return createNodeDefinition(FromPromiseNodeType, {
    get: typeof definition === 'function' ? definition : definition.get,
    set: typeof definition === 'function' ? setFactory : definition.set,
  });
}

export function isFromPromiseNodeDefinition(
  value: NodeDefinition,
): value is FromPromiseNodeDefinition {
  return value.type === FromPromiseNodeType;
}

function fetchValue(
  self: NodeExecutionContext<FromPromiseNodeState, FromPromiseNodeData>,
  node: FromPromiseNode,
): void {
  const { get } = node.definition.properties;
  if (!get) return;
  const { currentValue, pendingUpdate } = self.getState();
  if (currentValue || pendingUpdate) return;
  let operation: Promise<NodeDefinition | NodeLike>;
  try {
    operation = Promise.resolve(get(getParams(node.context))).catch((e) => error(e));
  } catch (e) {
    operation = Promise.resolve(error(e));
  }
  const pendingGet = operation.then((result) => {
    const isMostRecentFetch = (self.getData() || {}).pendingGet === pendingGet;
    if (!isMostRecentFetch) return;
    const currentValue = isNodeDefinition(result) ? result : toValue(result);
    self.setData((data) => ({
      ...data,
      pendingGet: undefined,
    }));
    self.setState((state) => ({
      ...state,
      currentValue,
    }));
    return currentValue;
  });
  self.setData((data) => ({
    ...data,
    pendingGet,
  }));
}
