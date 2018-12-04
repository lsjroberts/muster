import mapValues from 'lodash/mapValues';
import {
  CallArgument,
  CallArgumentArray,
  CallArgumentMap,
  callOperation,
  CallOperation,
  isCallArgumentArray,
  isCallArgumentMap,
  isNodeLikeCallArgumentMap,
  NodeLikeCallArgument,
  NodeLikeCallArgumentArray,
  NodeLikeCallArgumentMap,
  untilSupportsCallOperation,
} from '../../operations/call';
import {
  GraphAction,
  GraphNode,
  isGraphNode,
  isNodeDefinition,
  NodeDefinition,
  NodeDependency,
  StatelessGraphNode,
  StatelessNodeDefinition,
  StatelessNodeType,
} from '../../types/graph';
import createGraphAction from '../../utils/create-graph-action';
import createNodeDefinition from '../../utils/create-node-definition';
import { createNodeType } from '../../utils/create-node-type';
import { getInvalidTypeError } from '../../utils/get-invalid-type-error';
import * as graphTypes from '../../utils/graph-types';
import * as types from '../../utils/types';
import withScopeFrom from '../../utils/with-scope-from';
import { error } from './error';
import { value } from './value';

/**
 * An instance of the [[partial]] node.
 * See the [[partial]] documentation to find out more.
 */
export interface PartialNode extends StatelessGraphNode<'partial', PartialNodeProperties> {}

/**
 * A definition of the [[partial]] node.
 * See the [[partial]] documentation to find out more.
 */
export interface PartialNodeDefinition
  extends StatelessNodeDefinition<'partial', PartialNodeProperties> {}

export interface PartialNodeProperties {
  args: CallArgumentArray | CallArgumentMap;
  target: NodeDefinition;
}

/**
 * The implementation of the [[partial]] node.
 * See the [[partial]] documentation to learn more.
 */
export const PartialNodeType: StatelessNodeType<'partial', PartialNodeProperties> = createNodeType<
  'partial',
  PartialNodeProperties
>('partial', {
  shape: {
    args: types.oneOfType([
      types.objectOf(types.oneOfType([graphTypes.nodeDefinition, graphTypes.graphNode])),
      types.arrayOf(types.oneOfType([graphTypes.nodeDefinition, graphTypes.graphNode])),
    ]),
    target: graphTypes.nodeDefinition,
  },
  operations: {
    call: {
      getDependencies({ target }: PartialNodeProperties): Array<NodeDependency> {
        return [
          {
            target,
            until: untilSupportsCallOperation,
          },
        ];
      },
      run(
        node: PartialNode,
        operation: CallOperation,
        [target]: [GraphNode],
      ): NodeDefinition | GraphAction {
        const { args } = node.definition.properties;
        const { args: inputArgs } = operation.properties;
        if (isCallArgumentMap(args)) {
          // Handle the named arguments map
          if (inputArgs && !isCallArgumentMap(inputArgs)) {
            return error(
              getInvalidTypeError('A partial node was called with unexpected type of arguments.', {
                expected: 'Named arguments',
                received: 'Array of arguments',
              }),
            );
          }
          const combinedArgs = inputArgs ? { ...inputArgs, ...args } : args;
          const argsGraphNodes = mapValues(combinedArgs, (arg) =>
            isGraphNode(arg) ? arg : withScopeFrom(node, arg),
          );
          return createGraphAction(target, callOperation(argsGraphNodes));
        }
        // Handle the positional arguments
        if (inputArgs && !isCallArgumentArray(inputArgs)) {
          return error(
            getInvalidTypeError('A partial node was called with unexpected type of arguments.', {
              expected: 'Array of arguments',
              received: 'Named arguments',
            }),
          );
        }
        const combinedArgs = inputArgs ? [...args, ...inputArgs] : args;
        const argsGraphNodes = combinedArgs.map((arg) =>
          isGraphNode(arg) ? arg : withScopeFrom(node, arg),
        );
        return createGraphAction(target, callOperation(argsGraphNodes));
      },
    },
  },
});

/**
 * Creates a new instance if the [[partial]] node, which can be used to create a partially applied
 * functions. This node works with both named and positional arguments.
 *
 *
 * @example **Bind positional arguments**
 * ```js
 * import muster, { action, call, partial, ref } from '@dws/muster';
 *
 * const app = muster({
 *   greet: action((name) => `Hello, ${name}!`),
 *   greetBob: partial(ref('greet'), ['Bob']),
 * });
 *
 * await app.resolve(call('greetBob'));
 * // === 'Hello, Bob!'
 *
 * await app.resolve(call('greet', ['Alice']));
 * // === 'Hello, Alice!'
 *
 * await app.resolve(call('greetBob', ['Alice']));
 * // === 'Hello, Bob!'
 * ```
 * This example shows how to use the [[partial]] node to partially apply the positional arguments.
 * This method works with any node supporting the `call` operation (e.g. [[fn]], [[apply]], etc.).
 *
 *
 * @example **Bind named argument**
 * ```js
 * import muster, { action, call, partial, ref } from '@dws/muster';
 *
 * const app = muster({
 *   greet: action(({ name }) => `Hello, ${name}!`),
 *   greetBob: partial(ref('greet'), { name: 'Bob' }),
 * });
 *
 * await app.resolve(call('greetBob'));
 * // === 'Hello, Bob!'
 *
 * await app.resolve(call('greet', { name: 'Alice' }));
 * // === 'Hello, Alice!'
 *
 * await app.resolve(call('greetBob', { name: 'Alice' }));
 * // === 'Hello, Bob!'
 * ```
 * This example shows how to use the [[partial]] node to partially apply named arguments.
 * This method works with any node supporting the `call` operation (e.g. [[fn]], [[apply]], etc.).
 */
export function partial(
  target: NodeDefinition,
  args: NodeLikeCallArgumentArray | NodeLikeCallArgumentMap,
): PartialNodeDefinition {
  return createNodeDefinition(PartialNodeType, {
    args: isNodeLikeCallArgumentMap(args)
      ? mapValues(args, parseArgument)
      : args.map(parseArgument),
    target,
  } as PartialNodeProperties);
}

export function isPartialNodeDefinition(value: NodeDefinition): value is PartialNodeDefinition {
  return value.type === PartialNodeType;
}

function parseArgument(arg: NodeLikeCallArgument): CallArgument {
  return isNodeDefinition(arg) || isGraphNode(arg) ? arg : value(arg);
}
