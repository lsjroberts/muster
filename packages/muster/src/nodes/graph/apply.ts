import mapValues from 'lodash/mapValues';
import {
  CallableGraphNode,
  CallArgumentArray,
  CallArgumentMap,
  callOperation,
  isCallArgumentArray,
  NodeLikeCallArgumentArray,
  NodeLikeCallArgumentMap,
  supportsCallOperation,
} from '../../operations/call';
import {
  GraphAction,
  GraphNode,
  isGraphNode,
  NodeDefinition,
  NodeDependency,
  NodeLike,
  StatelessGraphNode,
  StatelessNodeDefinition,
  StatelessNodeType,
} from '../../types/graph';
import createGraphAction from '../../utils/create-graph-action';
import createNodeDefinition from '../../utils/create-node-definition';
import { createNodeType } from '../../utils/create-node-type';
import { getInvalidTypeErrorMessage } from '../../utils/get-invalid-type-error';
import * as graphTypes from '../../utils/graph-types';
import * as types from '../../utils/types';
import withScopeFrom from '../../utils/with-scope-from';
import { toValue } from './value';

/**
 * An instance of the [[apply]] node.
 * See the [[apply]] documentation to find out more.
 */
export interface ApplyNode extends StatelessGraphNode<'apply', ApplyNodeProperties> {}

/**
 * A definition of the [[apply]] node.
 * See the [[apply]] documentation to find out more.
 */
export interface ApplyNodeDefinition
  extends StatelessNodeDefinition<'apply', ApplyNodeProperties> {}

export interface ApplyNodeProperties {
  args: CallArgumentMap | CallArgumentArray;
  target: NodeDefinition | GraphNode;
}

/**
 * The implementation of the [[apply]] node.
 * See the [[apply]] documentation for more information.
 */
export const ApplyNodeType: StatelessNodeType<'apply', ApplyNodeProperties> = createNodeType<
  'apply',
  ApplyNodeProperties
>('apply', {
  shape: {
    target: types.oneOfType<NodeDefinition | GraphNode>([
      graphTypes.nodeDefinition,
      graphTypes.graphNode,
    ]),
    args: types.oneOfType([
      types.arrayOf(types.oneOfType([graphTypes.nodeDefinition, graphTypes.graphNode])),
      types.objectOf(types.oneOfType([graphTypes.nodeDefinition, graphTypes.graphNode])),
    ]),
  },
  operations: {
    evaluate: {
      getDependencies({ target }: ApplyNodeProperties): [NodeDependency] {
        return [
          {
            target,
            until: untilSupportsCallOperation,
          },
        ];
      },
      run(node: ApplyNode, options: never, [subjectNode]: [CallableGraphNode]): GraphAction {
        const { args } = node.definition.properties;
        let argNodes: any;
        if (isCallArgumentArray(args)) {
          argNodes = args.map((arg) => (isGraphNode(arg) ? arg : withScopeFrom(node, arg)));
        } else {
          argNodes = mapValues(args, (arg) => (isGraphNode(arg) ? arg : withScopeFrom(node, arg)));
        }
        return createGraphAction(subjectNode, callOperation(argNodes));
      },
    },
  },
});

const untilSupportsCallOperation: NodeDependency['until'] = {
  predicate: supportsCallOperation,
  errorMessage(node: GraphNode): string {
    return getInvalidTypeErrorMessage(`Target node is not callable`, { received: node.definition });
  },
};

/**
 * Creates an instance of an [[apply]] node, which is a node used to apply arguments to a [[NodeDefinition]] that implements a `call` method, e.g.
 * [[action]] or [fn](_nodes_graph_fn_.html#fn). Unlike the [[call]], which
 * invokes the target function only once, the [[apply]] maintains an active
 * subscription to the input arguments and to the output value of the function. This means that
 * whenever the input arguments change, the target function body will be re-invoked, and whenever the
 * result of the target function changes, a new value will be returned. You can think of an
 * [[apply]] as analogous to an observable stream that combines the given input
 * argument streams and transforms them into an output stream. Multiple subscriptions to the
 * [[apply]] do not cause multiple executions of the callable node body.
 *
 *
 * @example **Apply arguments to an fn node**
 * ```ts
 * import muster, { apply, fn, format, ref } from '@dws/muster';
 *
 * const app = muster({
 *   getFullName: fn((firstName, lastName, title) => format('${title} ${firstName} ${lastName}', {
 *     firstName,
 *     lastName,
 *     title
 *   })),
 * });
 *
 * console.log('Applying the graph function');
 * const result = await app.resolve(
 *   apply(['Rosalind', 'Franklin', 'Ms'], ref('getFullName')),
 * );
 * // result === 'Ms Rosalind Franklin'
 *
 * console.log(result);
 *
 * // Console output:
 * // Applying the graph function
 * // Ms Rosalind Franklin
 * ```
 * This example shows how to supply arguments to an [fn](_nodes_graph_fn_.html#fn) - the same can be done with
 * an [[action]]. There are no restrictions on the type of the arguments.
 * Note the use of a [[format]] to combine strings. See the [[format]] documentation for more information.
 *
 *
 * @example **Stream-like nature of apply**
 * ```ts
 * import muster, { apply, fn, format, ref, set, variable } from '@dws/muster';
 *
 * const app = muster({
 *   greeting: variable('Hello'),
 *   getGreeting: fn((greeting, name) => format('${greeting}, ${name}', { greeting, name })),
 * });
 *
 * console.log('Applying getGreeting');
 * app.resolve(apply([ref('greeting'), 'Bob'], ref('getGreeting'))).subscribe((output) => {
 *   console.log(output);
 * });
 *
 * console.log('Changing the greeting');
 * await app.resolve(set('greeting', 'Goodbye'));
 *
 * // Console output:
 * // Applying getGreeting
 * // Hello, Bob
 * // Changing the greeting
 * // Goodbye, Bob
 * ```
 * This example shows how the apply node can be used to create a stream that computes a new value
 * every time its input arguments change their value.
 */
export function apply(target: NodeDefinition | GraphNode): ApplyNodeDefinition;
export function apply(
  args: NodeLikeCallArgumentArray,
  target: NodeDefinition | GraphNode,
): ApplyNodeDefinition;
export function apply(
  args: NodeLikeCallArgumentMap,
  target: NodeDefinition | GraphNode,
): ApplyNodeDefinition;

export function apply(
  ...options:
    | [NodeDefinition | GraphNode]
    | [NodeLikeCallArgumentArray, NodeDefinition | GraphNode]
    | [NodeLikeCallArgumentMap, NodeDefinition | GraphNode]
): ApplyNodeDefinition {
  if (options.length === 2) {
    const [args, target] = options;
    // function apply(args: NodeLikeCallArgumentArray, target: NodeDefinition | GraphNode): ApplyNodeDefinition
    if (isCallArgumentArray(args)) {
      return createNodeDefinition(ApplyNodeType as any, {
        target,
        args: args.map(parseArg),
      });
    }
    // function apply(args: NodeLikeCallArgumentMap, target: NodeDefinition | GraphNode): ApplyNodeDefinition
    return createNodeDefinition(ApplyNodeType as any, {
      target,
      args: mapValues(args, parseArg),
    });
  }
  const [target] = options;
  // function apply(target: NodeDefinition | GraphNode): ApplyNodeDefinition
  return createNodeDefinition(ApplyNodeType as any, {
    target,
    args: [],
  });
}

export function isApplyNodeDefinition(value: NodeDefinition): value is ApplyNodeDefinition {
  return value.type === ApplyNodeType;
}

function parseArg(arg: NodeDefinition | GraphNode | NodeLike): NodeDefinition | GraphNode {
  return isGraphNode(arg) ? arg : toValue(arg);
}
