import mapValues from 'lodash/mapValues';
import {
  CallArgument,
  CallArgumentArray,
  CallArgumentMap,
  callOperation,
  isCallArgumentMap,
  isNodeLikeCallArgumentMap,
  NodeLikeCallArgument,
  NodeLikeCallArgumentArray,
  NodeLikeCallArgumentMap,
  untilSupportsCallOperation,
} from '../../operations/call';
import {
  GraphNode,
  isGraphNode,
  isNodeDefinition,
  NodeDefinition,
  NodeExecutionContext,
  NodeLike,
  StatefulGraphNode,
  StatefulNodeDefinition,
  StatefulNodeType,
} from '../../types/graph';
import createNodeDefinition from '../../utils/create-node-definition';
import { createNodeType } from '../../utils/create-node-type';
import * as graphTypes from '../../utils/graph-types';
import { isRootAndPath, ref, RootAndPath } from '../../utils/ref';
import * as types from '../../utils/types';
import withScopeFrom from '../../utils/with-scope-from';
import { get } from './get';
import { pending } from './pending';
import { resolve } from './resolve';
import { root } from './root';
import { traverse } from './traverse';
import { toValue } from './value';

/**
 * An instance of the [[call]] node.
 * See the [[call]] documentation to find out more.
 */
export interface CallNode
  extends StatefulGraphNode<'call', CallNodeProperties, CallNodeState, CallNodeData> {}

/**
 * A definition of the [[call]] node.
 * See the [[call]] documentation to find out more.
 */
export interface CallNodeDefinition
  extends StatefulNodeDefinition<'call', CallNodeProperties, CallNodeState, CallNodeData> {}

export interface CallNodeProperties {
  args: CallArgumentArray | CallArgumentMap | undefined;
  target: NodeDefinition;
}

export interface CallNodeState {
  currentValue: NodeDefinition | GraphNode;
}

export interface CallNodeData {}

/**
 * The implementation of a [[call]] node.
 * See the [[call]] documentation for more information.
 */
export const CallNodeType: StatefulNodeType<
  'call',
  CallNodeProperties,
  CallNodeState,
  CallNodeData
> = createNodeType<'call', CallNodeProperties, CallNodeState, CallNodeData>('call', {
  shape: {
    target: graphTypes.nodeDefinition,
    args: types.optional(
      types.oneOfType([
        types.arrayOf(types.oneOfType([graphTypes.nodeDefinition, graphTypes.graphNode])),
        types.objectOf(types.oneOfType([graphTypes.nodeDefinition, graphTypes.graphNode])),
      ]),
    ),
  },
  state: {
    currentValue: types.oneOfType([graphTypes.nodeDefinition, graphTypes.graphNode]),
  },
  getInitialState() {
    return {
      currentValue: pending(),
    };
  },
  operations: {
    evaluate: {
      cacheable: false,
      run(
        node: CallNode,
        options: never,
        dependencies: never,
        context: never,
        state: CallNodeState,
      ): GraphNode | NodeDefinition {
        return state.currentValue;
      },
      onSubscribe(this: NodeExecutionContext<CallNodeState, CallNodeData>, node: CallNode): void {
        const { target } = node.definition.properties;
        const updateState = ([result]: [GraphNode]) => {
          this.setState({ currentValue: result });
          return result;
        };
        this.setState({
          currentValue: resolve([{ target, until: untilSupportsCallOperation }], ([targetNode]) => {
            const { args } = node.definition.properties;
            let argNodes: CallArgumentMap | CallArgumentArray | undefined;
            if (args) {
              argNodes = isCallArgumentMap(args)
                ? mapValues(args, (arg) => (isGraphNode(arg) ? arg : withScopeFrom(node, arg)))
                : args.map((arg) => (isGraphNode(arg) ? arg : withScopeFrom(node, arg)));
            }
            const traverseTarget = traverse(targetNode.definition, callOperation(argNodes));
            return resolve([{ target: withScopeFrom(targetNode, traverseTarget) }], updateState);
          }),
        });
      },
    },
  },
});

/**
 * Creates a new instance of a [[call]] node, which is a node used when calling a [[NodeDefinition]] that implements a `call` method, e.g. [[action]],
 * [fn](_nodes_graph_fn_.html#fn) or [[placeholder]]. Unlike the [[apply]], the [[call]] calls the
 * body of the callable node only once per subscription. Multiple subscriptions to the [[call]]
 * cause multiple executions of the callable node body. This imitates standard JavaScript function calls and can be
 * used when responding to button clicks or events in applications.
 *
 *
 * @example **Call an action**
 * ```ts
 * import muster, { action, call } from '@dws/muster';
 *
 * const app = muster({
 *   logSomething: action(() => {
 *     console.log('Action called');
 *   }),
 * });
 *
 * console.log('Calling the action');
 * const result = await app.resolve(call('logSomething'));
 * // result === undefined
 *
 * // Console output:
 * // Calling the action
 * // Action called
 * ```
 * This example shows how to call a basic [[action]]. You can learn more about the [[action]] in its documentation.
 *
 *
 * @example **Call an fn node**
 * ```ts
 * import muster, { call, fn, value } from '@dws/muster';
 *
 * const app = muster({
 *   getGreeting: fn(() => value('Hello world')),
 * });
 *
 * console.log('Calling the fn');
 * const result = await app.resolve(call('getGreeting'));
 * // result === 'Hello world'
 *
 * console.log(result);
 *
 * // Console output:
 * // Calling the fn
 * // Hello world
 * ```
 * This example shows how to call a basic [fn](_nodes_graph_fn_.html#fn).
 * You can learn more about the [fn](_nodes_graph_fn_.html#fn) in its documentation.
 *
 *
 * @example **Call with arguments**
 * ```ts
 * import muster, { action, call, ref } from '@dws/muster';
 *
 * const app = muster({
 *   lastName: 'Franklin',
 *   getFullName: action((firstName, lastName) => `${firstName} ${lastName}`),
 * });
 *
 * console.log('Calling the action');
 * const result = await app.resolve(
 *   call('getFullName', ['Rosalind', ref('lastName')])
 * );
 * // result === 'Rosalind Franklin'
 *
 * console.log(result);
 *
 * // Console output:
 * // Calling the action
 * // Rosalind Franklin
 * ```
 * This example shows how to supply arguments to the called [[action]] - the same can be done
 * with the [fn](_nodes_graph_fn_.html#fn). There are no restrictions on the type of the arguments. When Muster
 * encounters an argument that is not a [[NodeDefinition]], an automatic conversion with the [[toValue]]
 * helper occurs. An argument that is already A type of [[NodeDefinition]] is resolved to its most
 * basic form before calling the action.
 *
 *
 * @example **Multiple consecutive calls**
 * ```js
 * import muster, { action, call } from '@dws/muster';
 *
 * const app = muster({
 *   logWhenCalled: action(() => {
 *     console.log('Action called');
 *   }),
 * });
 *
 * console.log('First call:')
 * app.resolve(call('logWhenCalled')).subscribe(() => {});
 *
 * console.log('Second call:');
 * app.resolve(call('logWhenCalled')).subscribe(() => {});
 *
 * // Console output:
 * // First call:
 * // Action called
 * // Second call:
 * // Action called
 * ```
 * This example shows that the [[call]] node runs the body of an action every time a [[call]] is resolved.
 */
export function call(rootAndPathInput: RootAndPath): CallNodeDefinition;
export function call(
  rootAndPathInput: RootAndPath,
  args: NodeLikeCallArgumentArray,
): CallNodeDefinition;
export function call(
  rootAndPathInput: RootAndPath,
  args: NodeLikeCallArgumentMap,
): CallNodeDefinition;
export function call(target: NodeDefinition): CallNodeDefinition;
export function call(target: NodeDefinition, args: NodeLikeCallArgumentArray): CallNodeDefinition;
export function call(target: NodeDefinition, args: NodeLikeCallArgumentMap): CallNodeDefinition;
export function call(
  root: NodeDefinition,
  path: Array<NodeLike>,
  args: NodeLikeCallArgumentArray,
): CallNodeDefinition;
export function call(
  root: NodeDefinition,
  path: Array<NodeLike>,
  args: NodeLikeCallArgumentMap,
): CallNodeDefinition;
export function call(path: NodeLike | Array<NodeLike>): CallNodeDefinition;
export function call(
  path: NodeLike | Array<NodeLike>,
  args: NodeLikeCallArgumentArray,
): CallNodeDefinition;
export function call(
  path: NodeLike | Array<NodeLike>,
  args: NodeLikeCallArgumentMap,
): CallNodeDefinition;

export function call(
  ...args: Array<
    RootAndPath | NodeDefinition | NodeLike | NodeLikeCallArgumentMap | NodeLikeCallArgumentArray
  >
): CallNodeDefinition {
  if (isRootAndPath(args[0])) {
    // function call(rootAndPathInput: RootAndPath, args: NodeLikeCallArgumentMap): CallNodeDefinition;
    if (args.length > 1 && isNodeLikeCallArgumentMap(args[1])) {
      const [rootAndPath, callArgs] = args as [RootAndPath, NodeLikeCallArgumentMap];
      return createNodeDefinition(CallNodeType as any, {
        target: ref(rootAndPath),
        args: mapValues(callArgs, toValueOrGraphNode),
      });
    }
    // function call(rootAndPathInput: RootAndPath, args?: NodeLikeCallArgumentArray): CallNodeDefinition
    const [rootAndPath, callArgs] = args as [RootAndPath, NodeLikeCallArgumentArray | undefined];
    return createNodeDefinition(CallNodeType as any, {
      target: ref(rootAndPath),
      args: callArgs ? callArgs.map(toValueOrGraphNode) : undefined,
    });
  }

  if (!isNodeDefinition(args[0])) {
    // function call(path: NodeLike | Array<NodeLike>, args: NodeLikeCallArgsMap): CallNodeDefinition
    if (args.length > 1 && isNodeLikeCallArgumentMap(args[1])) {
      const [path, callArgs] = args as [NodeLike | Array<NodeLike>, NodeLikeCallArgumentMap];
      return createNodeDefinition(CallNodeType as any, {
        target: get(root(), path),
        args: mapValues(callArgs, toValueOrGraphNode),
      });
    }
    // function call(path: NodeLike | Array<NodeLike>, args?: NodeLikeCallArgumentArray): CallNodeDefinition
    const [path, callArgs] = args as [
      NodeLike | Array<NodeLike>,
      NodeLikeCallArgumentArray | undefined
    ];
    return createNodeDefinition(CallNodeType as any, {
      target: get(root(), path),
      args: callArgs ? callArgs.map(toValueOrGraphNode) : undefined,
    });
  }
  if (args.length === 3 && Array.isArray(args[1])) {
    // function call(root: NodeDefinition, path: Array<NodeLike>, args: NodeLikeCallArgsMap): CallNodeDefinition
    if (isNodeLikeCallArgumentMap(args[2])) {
      const [rootNode, path, callArgs] = args as [
        NodeDefinition,
        Array<NodeLike>,
        NodeLikeCallArgumentMap
      ];
      return createNodeDefinition(CallNodeType as any, {
        target: ref({ root: rootNode, path }),
        args: mapValues(callArgs, toValueOrGraphNode),
      });
    }
    // function call(root: NodeDefinition, path: Array<NodeLike>, args: NodeLikeCallArgumentArray): CallNodeDefinition
    const [rootNode, path, callArgs] = args as [
      NodeDefinition,
      Array<NodeLike>,
      NodeLikeCallArgumentArray
    ];
    return createNodeDefinition(CallNodeType as any, {
      target: ref({ root: rootNode, path }),
      args: callArgs.map(toValueOrGraphNode),
    });
  }
  // function call(target: NodeDefinition, args: NodeLikeCallArgsMap): CallNodeDefinition
  if (args.length === 2 && isNodeLikeCallArgumentMap(args[1])) {
    const [target, callArgs] = args as [NodeDefinition, NodeLikeCallArgumentMap];
    return createNodeDefinition(CallNodeType as any, {
      target,
      args: mapValues(callArgs, toValueOrGraphNode),
    });
  }
  // function call(target: NodeDefinition, args?: NodeLikeCallArgumentArray): CallNodeDefinition
  const [target, callArgs] = args as [NodeDefinition, NodeLikeCallArgumentArray | undefined];
  return createNodeDefinition(CallNodeType as any, {
    target,
    args: callArgs ? callArgs.map(toValueOrGraphNode) : undefined,
  });
}

export function isCallNodeDefinition(value: NodeDefinition): value is CallNodeDefinition {
  return value.type === CallNodeType;
}

function toValueOrGraphNode(value: NodeLikeCallArgument): CallArgument {
  return isGraphNode(value) ? value : toValue(value);
}
