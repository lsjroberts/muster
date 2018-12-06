import { ObservableLike, Subscription } from '@dws/muster-observable';
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
import { pending } from './pending';
import { getParams } from './tree';
import { value } from './value';

/**
 * An instance of the [[fromStream]] node.
 * See the [[fromStream]] documentation to find out more.
 */
export interface FromStreamNode
  extends StatefulGraphNode<
      'fromStream',
      FromStreamNodeProperties,
      FromStreamNodeState,
      FromStreamNodeData
    > {}

/**
 * A definition of the [[fromStream]] node.
 * See the [[fromStream]] documentation to find out more.
 */
export interface FromStreamNodeDefinition
  extends NodeDefinition<
      'fromStream',
      FromStreamNodeProperties,
      FromStreamNodeState,
      FromStreamNodeData
    > {}

export type ValueStream = ObservableLike<NodeDefinition | NodeLike>;
export type ValueStreamFactory = ((params: Params) => ValueStream);

export interface FromStreamNodeProperties {
  factory: ValueStream | ValueStreamFactory;
}

export interface FromStreamNodeState {
  currentValue: NodeDefinition | undefined;
}

export interface FromStreamNodeData {
  subscription: Subscription;
}

/**
 * The implementation of the [[fromStream]] node.
 * See the [[fromStream]] documentation to learn more.
 */
export const FromStreamNodeType: StatefulNodeType<
  'fromStream',
  FromStreamNodeProperties,
  FromStreamNodeState
> = createNodeType<'fromStream', FromStreamNodeProperties, FromStreamNodeState>('fromStream', {
  serialize: false,
  deserialize: false,
  state: {
    currentValue: types.optional(graphTypes.nodeDefinition),
  },
  shape: {
    factory: types.saveHash(
      types.oneOfType<Function | { subscribe: Function }>([
        types.func,
        types.instance({ subscribe: types.func }),
        types.shape({ subscribe: types.func }),
      ]),
    ),
  },
  getInitialState(): FromStreamNodeState {
    return {
      currentValue: undefined,
    };
  },
  operations: {
    evaluate: {
      run(
        node: FromStreamNode,
        options: never,
        dependencies: Array<never>,
        context: Array<never>,
        state: FromStreamNodeState,
      ): NodeDefinition {
        const { currentValue } = state;
        return currentValue || pending();
      },
      onSubscribe(
        this: NodeExecutionContext<FromStreamNodeState, FromStreamNodeData>,
        node: FromStreamNode,
      ): void {
        const { factory } = node.definition.properties;
        const { subscription: existingSubscription } = this.getData();
        let isSync = true;
        let syncValue: NodeDefinition | undefined;
        const stream = typeof factory === 'function' ? factory(getParams(node.context)) : factory;
        const subscription = stream.subscribe((rawValue) => {
          const valueNode = isNodeDefinition(rawValue) ? rawValue : value(rawValue);
          if (isSync) {
            syncValue = valueNode;
          } else {
            this.setState({
              currentValue: valueNode,
            });
          }
        });
        isSync = false;
        if (existingSubscription) {
          existingSubscription.unsubscribe();
        }
        this.setData({
          subscription,
        });
        if (syncValue) {
          this.setState({
            currentValue: syncValue,
          });
        }
      },
      onUnsubscribe(this: NodeExecutionContext<FromStreamNodeState, FromStreamNodeData>): void {
        const { subscription } = this.getData();
        subscription && subscription.unsubscribe();
      },
    },
  },
});

/**
 * Creates an instance of a [[fromStream]] node, which is a type of [[NodeDefinition]] that allows plugging
 * streams/observables into Muster. This node will emit new values every time the underlying stream emits.
 * The [[fromStream]] opens the subscription to the source stream only when
 * subscribed to. It also unsubscribes from the source stream when all subscriptions
 * to this graph node are closed.
 *
 * The [[fromStream]] works with any stream library that conforms to the
 * [Observable API](https://tc39.github.io/proposal-observable/).
 * Examples of libraries that should work with the [[fromStream]]:
 * - [RxJS](http://reactivex.io/rxjs/)
 * - [most.js](https://github.com/cujojs/most)
 *
 *
 * @example **Simple stream**
 * ```ts
 * import { BehaviorSubject } from '@dws/muster-observable';
 * import muster, { fromStream, ref, value } from '@dws/muster';
 *
 * const subject = new BehaviorSubject(value('initial'));
 * const app = muster({
 *   myStreamedValue: fromStream(subject),
 * });
 *
 * app.resolve(ref('myStreamedValue')).subscribe((res) => {
 *   console.log(res);
 * });
 *
 * subject.next(value('updated'));
 *
 * // Console output:
 * // initial
 * // updated
 * ```
 * This example shows how to plug a Behaviour Subject into Muster. Note that in the subscribe
 * callback the `res` is a [value](../modules/_nodes_graph_value_.html#value). The [[fromStream]] automatically wraps the value
 * returned from the stream with a `value` node.
 *
 *
 * @example **Connecting two instances of Muster**
 * ```ts
 * import muster, { fromStream, ref, set, variable } from '@dws/muster';
 *
 * const otherApp = muster({
 *   name: variable('initial'),
 * });
 *
 * const app = muster({
 *   remoteName: fromStream(otherApp.resolve(ref('name'))),
 * });
 *
 * app.resolve(ref('remoteName')).subscribe((res) => {
 *   console.log(res);
 * });
 *
 * await otherApp.resolve(set('name', 'updated'));
 *
 * // Console output:
 * // initial
 * // updated
 * ```
 * Because the output value of the `muster.resolve` also conforms to the Observable API,
 * you can create connections between two instances of Muster. **This is not a recommended
 * way of making that connection.** It only serves as an example how to handle different kinds of
 * streams.
 */
export function fromStream(factory: ValueStream | ValueStreamFactory): FromStreamNodeDefinition {
  return createNodeDefinition(FromStreamNodeType, {
    factory,
  });
}

export function isFromStreamNodeDefinition(
  value: NodeDefinition,
): value is FromStreamNodeDefinition {
  return value.type === FromStreamNodeType;
}
