import fromPairs from 'lodash/fromPairs';
import toPairs from 'lodash/toPairs';
import uniqueId from 'lodash/uniqueId';
import zip from 'lodash/zip';
import { CallOperation, isCallArgumentArray, isCallArgumentMap } from '../../operations/call';
import {
  GraphNode,
  isGraphNode,
  NodeDefinition,
  StatelessGraphNode,
  StatelessNodeDefinition,
  StatelessNodeType,
} from '../../types/graph';
import { getInvalidTypeError } from '../../utils';
import { createContext } from '../../utils/create-context';
import createGraphNode from '../../utils/create-graph-node';
import createNodeDefinition from '../../utils/create-node-definition';
import { createNodeType } from '../../utils/create-node-type';
import * as graphTypes from '../../utils/graph-types';
import * as types from '../../utils/types';
import withScopeFrom from '../../utils/with-scope-from';
import { context, ContextNodeDefinition } from './context';
import { error } from './error';

/**
 * An instance of the [fn](../modules/_nodes_graph_fn_.html#fn) node.
 * See the [fn](../modules/_nodes_graph_fn_.html#fn) documentation to find out more.
 */
export interface FnNode extends StatelessGraphNode<'fn', FnNodeProperties> {}

/**
 * A definition of the [fn](../modules/_nodes_graph_fn_.html#fn) node.
 * See the [fn](../modules/_nodes_graph_fn_.html#fn) documentation to learn more.
 */
export interface FnNodeDefinition extends StatelessNodeDefinition<'fn', FnNodeProperties> {}

export interface FnNodeProperties {
  argIds: Array<string>;
  body: NodeDefinition;
  hasNamedArgs: boolean;
}

/**
 * The implementation of the [fn](../modules/_nodes_graph_fn_.html#fn).
 * See the [fn](../modules/_nodes_graph_fn_.html#fn) documentation to learn more.
 */
export const FnNodeType: StatelessNodeType<'fn', FnNodeProperties> = createNodeType<
  'fn',
  FnNodeProperties
>('fn', {
  shape: {
    argIds: types.arrayOf(types.string),
    body: graphTypes.nodeDefinition,
    hasNamedArgs: types.bool,
  },
  operations: {
    call: {
      run(node: FnNode, operation: CallOperation): NodeDefinition | GraphNode {
        const { argIds, body, hasNamedArgs } = node.definition.properties;
        const { args } = operation.properties;
        if (hasNamedArgs) {
          // Handle calling function with named arguments
          if (args && isCallArgumentArray(args)) {
            return error(
              'An fn() expected to have been called with named arguments, ' +
                'but was called with an array of arguments.',
            );
          }
          const receivedArgsNames = args ? Object.keys(args) : [];
          const isMissingArguments = argIds.some((name) => !receivedArgsNames.includes(name));
          if (isMissingArguments) {
            return error(
              getInvalidTypeError('An fn() was called with unexpected number of arguments.', {
                expected: argIds,
                received: receivedArgsNames,
              }),
            );
          }
          const sanitizedArgs = fromPairs(
            toPairs(args).map(([name, value]) => [
              `$$named-arg:${name}`,
              isGraphNode(value) ? value : withScopeFrom(node, value),
            ]),
          );
          const childContext = createContext(node.context, sanitizedArgs);
          return createGraphNode(node.scope, childContext, body);
        }
        // Handle calling function with an array of arguments
        if (args && isCallArgumentMap(args)) {
          return error(
            'An fn() expected to have been called with an array of arguments, ' +
              'but was called with named arguments.',
          );
        }
        if ((!args && argIds.length > 0) || (args && args.length < argIds.length)) {
          return error(
            getInvalidTypeError('Too few arguments applied to fn.', {
              expected: argIds.length,
              received: args ? args.length : 0,
            }),
          );
        }
        const trimmedArgs = (args ? args.slice(0, argIds.length) : []).map((arg) =>
          isGraphNode(arg) ? arg : withScopeFrom(node, arg),
        );
        const context = fromPairs(zip<string | GraphNode>(argIds, trimmedArgs) as Array<
          [string, GraphNode]
        >);
        const childContext = createContext(node.context, context);
        return createGraphNode(node.scope, childContext, body);
      },
    },
  },
});

export type NamedFnArgs = { [argName: string]: ContextNodeDefinition };

/**
 * Creates a new instance of a [[fn]] node, which is a type of a [[NodeDefinition]] used for representing executable
 * functions implemented with muster [[NodeDefinition]]s. These functions are safely serializable and can be executed
 * on a remote muster instances.
 *
 * The [[fn]] is being used by the collection transforms to represent filters and other types of collection transforms.
 *
 * The [[fn]] can be executed with the help of [[call]] and [[apply]].
 *
 *
 * @example **Create a simple [[fn]]**
 * ```js
 * import { fn, value } from '@dws/muster';
 *
 * fn(() => value(true));
 * ```
 * This example shows how to create a very basic [[fn]] that simply returns a true [[value]]
 * ever time it gets called.
 *
 *
 * @example **Create an [[fn]] with args**
 * ```js
 * import { add, fn } from '@dws/muster';
 *
 * fn((num) => add(num, 5));
 * ```
 * This example shows how to create an [[fn]] capable of adding 5 to an argument.
 *
 *
 * @example **Calling an [[fn]]**
 * ```js
 * import muster, { add, call, fn } from '@dws/muster';
 *
 * const app = muster({
 *   addFive: fn((num) => add(num, 5)),
 * });
 *
 * await app.resolve(call('addFive', [3]));
 * // === 8
 * ```
 * This example shows how to call an [[fn]]. See the [[call]] and [[apply]]
 * documentation to learn more about calling callable nodes.
 *
 *
 * @example **Create an [[fn]] with named args**
 * ```js
 * import muster, { call, fn, format } from '@dws/muster';
 *
 * const app = muster({
 *   greet: fn(['name'], ({ name }) =>
 *     format('Hello, ${name}!', { name })
 *   ),
 * });
 *
 * await app.resolve(call('greet', { name: 'Bob' }));
 * // === 'Hello, Bob!'
 * ```
 * This example shows how to create and call an [[fn]] node with named arguments.
 */
// prettier-ignore-start
export function fn(
  factory: ((...args: Array<ContextNodeDefinition>) => NodeDefinition),
): FnNodeDefinition;
export function fn(
  argNames: Array<string>,
  factory: ((args: NamedFnArgs) => NodeDefinition),
): FnNodeDefinition;
// prettier-ignore-end

export function fn(
  ...options:
    | [Array<string>, ((args: NamedFnArgs) => NodeDefinition)]
    | [((...args: Array<ContextNodeDefinition>) => NodeDefinition)]
): FnNodeDefinition {
  // fn(factory: ((...args: Array<ContextNodeDefinition>) => NodeDefinition)): FnNodeDefinition;
  if (options.length === 1) {
    const [factory] = options;
    const argIds = Array(factory.length)
      .fill(undefined)
      .map(createId);
    return createNodeDefinition(FnNodeType, {
      argIds,
      body: factory(...argIds.map(context)),
      hasNamedArgs: false,
    });
  }
  // fn(argNames: Array<string>, factory: ((args: NamedFnArgs) => NodeDefinition)): FnNodeDefinition
  const [argNames, factory] = options;
  const args = fromPairs(argNames.map((name) => [name, context(`$$named-arg:${name}`)]));
  return createNodeDefinition(FnNodeType, {
    argIds: argNames,
    body: factory(args),
    hasNamedArgs: true,
  });
}

export function isFnNodeDefinition(value: NodeDefinition): value is FnNodeDefinition {
  return value.type === FnNodeType;
}

function createId(): string {
  return uniqueId(`$$arg:`);
}
