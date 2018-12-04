import { CallOperation } from '../../operations/call';
import {
  GraphNode,
  isNodeDefinition,
  NodeDefinition,
  NodeDependency,
  NodeExecutionContext,
  NodeLike,
  StatefulGraphNode,
  StatefulNodeType,
} from '../../types/graph';
import createNodeDefinition from '../../utils/create-node-definition';
import { createNodeType } from '../../utils/create-node-type';
import * as graphTypes from '../../utils/graph-types';
import * as types from '../../utils/types';
import withScopeFrom from '../../utils/with-scope-from';
import { ErrorNodeDefinition, ErrorNodeType } from './error';
import { resolve } from './resolve';
import { traverse } from './traverse';
import { toValue, value } from './value';

/**
 * An instance of the [[ifError]] node.
 * See the [[ifError]] documentation to find out more.
 */
export interface IfErrorNode
  extends StatefulGraphNode<'ifError', IfErrorNodeProperties, IfErrorNodeState, IfErrorNodeData> {}

/**
 * A definition of the [[ifError]] node.
 * See the [[ifError]] documentation to find out more.
 */
export interface IfErrorNodeDefinition
  extends NodeDefinition<'ifError', IfErrorNodeProperties, IfErrorNodeState, IfErrorNodeData> {}

export type ErrorFallbackGenerator = ((
  error: ErrorNodeDefinition,
  previousValue: NodeDefinition | undefined,
) => NodeDefinition);

export interface IfErrorNodeProperties {
  target: NodeDefinition;
  fallback: ErrorFallbackGenerator;
}

export interface IfErrorNodeState {
  previousValues: {
    evaluate: GraphNode | undefined;
  };
}

export interface IfErrorNodeData {}

/**
 * The implementation of the [[ifError]].
 * See the [[ifError]] documentation to learn more.
 */
export const IfErrorNodeType: StatefulNodeType<
  'ifError',
  IfErrorNodeProperties,
  IfErrorNodeState,
  IfErrorNodeData
> = createNodeType<'ifError', IfErrorNodeProperties, IfErrorNodeState, IfErrorNodeData>('ifError', {
  state: {
    previousValues: types.shape({
      evaluate: types.optional(graphTypes.graphNode),
    }),
  },
  shape: {
    target: graphTypes.nodeDefinition,
    fallback: types.saveHash(types.func),
  },
  getInitialState(): IfErrorNodeState {
    return {
      previousValues: {
        evaluate: undefined,
      },
    };
  },
  operations: {
    evaluate: {
      getDependencies({ target }: IfErrorNodeProperties): Array<NodeDependency> {
        return [
          {
            target,
            allowErrors: true,
          },
        ];
      },
      run(
        node: IfErrorNode,
        options: never,
        [target]: [GraphNode],
        context: Array<never>,
        state: IfErrorNodeState,
      ): NodeDefinition | GraphNode {
        const { fallback } = node.definition.properties;
        const { previousValues } = state;
        if (ErrorNodeType.is(target)) {
          const previousValue = previousValues.evaluate;
          return fallback(target.definition, previousValue && previousValue.definition);
        }
        return target;
      },
      onUpdate(
        this: NodeExecutionContext<IfErrorNodeState, IfErrorNodeData>,
        node: IfErrorNode,
        options: never,
        [target]: [GraphNode],
      ): void {
        if (!ErrorNodeType.is(target)) {
          this.setState((prevState) => ({
            previousValues: {
              ...prevState.previousValues,
              evaluate: target,
            },
          }));
        }
      },
    },
    call: {
      run(node: IfErrorNode, operation: CallOperation): NodeDefinition | GraphNode {
        const { fallback, target } = node.definition.properties;
        return resolve([{ target: traverse(target, operation), allowErrors: true }], ([result]) => {
          if (ErrorNodeType.is(result)) {
            return withScopeFrom(node, fallback(result.definition, undefined));
          }
          return result;
        });
      },
    },
  },
});

/**
 * Creates a new instance of an [[ifError]] node, which is a type of [[NodeDefinition]] used when implementing
 * something like `try ... catch ...`, but for nodes. See the [[error]] documentation for an introduction to errors.
 *
 * The [[ifError]] can be used when a node resolves to an error node. You can configure what
 * should happen in that scenario by providing a fallback node or fallback generator function.
 * The fallback node will simply return that node instead of the [[error]]. The fallback generator
 * allows for more sophisticated error handling. It takes two arguments:
 * - [[error]]
 * It is expected to resolve to a [[NodeLike]] object.
 *
 *
 * @example **Catching error**
 * ```js
 * import muster, { computed, error, ifError, ref, set, value, variable } from '@dws/muster';
 *
 * const app = muster({
 *   age: variable(25),
 *   spirits: computed([ref('age')], (age) => {
 *     if (age < 18) {
 *       return error('Alcohol cannot be sold to people under 18!');
 *     }
 *     return ['Beer', 'Gin', 'Whisky', 'Wine'];
 *   }),
 * });
 *
 * console.log('Subscribing to spirits');
 * app.resolve(ifError(value([]), ref('spirits'))).subscribe((res) => {
 *   console.log(res);
 * });
 *
 * console.log('Changing age to 17')
 * await app.resolve(set('age', 17));
 *
 * // Console output:
 * // Subscribing to spirits
 * // ['Beer', 'Gin', 'Whisky', 'Wine']
 * // Changing age to 17
 * // []
 * ```
 * This example builds on the code from [[error]]. It wraps the `ref` to `spirits`
 * with an `ifError` to prevent any errors from being returned to the subscriber. It makes sure
 * that the subscriber always receives a value node with array of items.
 *
 *
 * @example **Using a fallback generator**
 * ```js
 * import muster, { computed, error, ifError, ref, set, value, variable } from '@dws/muster';
 *
 * const app = muster({
 *   age: variable(25),
 *   spirits: computed([ref('age')], (age) => {
 *     if (age < 18) {
 *       return error('Alcohol cannot be sold to people under 18!', { data: 1 });
 *     }
 *     return ['Beer', 'Gin', 'Whisky', 'Wine'];
 *   }),
 * });
 *
 * console.log('Subscribing to spirits');
 * app.resolve(ifError((error) => {
 *   if (error.properties.data === 1) {
 *     // It's safe to handle the error with data === 1
 *     return value([]);
 *   }
 *   // Something else has gone wrong, return that error
 *   return error;
 * }, ref('spirits'))).subscribe((res) => {
 *   console.log(res);
 * });
 *
 * console.log('Changing age to 17')
 * await app.resolve(set('age', 17));
 *
 * // Console output:
 * // Subscribing to spirits
 * // ['Beer', 'Gin', 'Whisky', 'Wine']
 * // Changing age to 17
 * // []
 * ```
 * This example shows how to use a fallback generator to catch only specific types of errors.
 * The fallback generator in this example checks if the error received has data equal to 1.
 * If not, it returns the original error.
 *
 *
 * @example **Catching action errors**
 * ```js
 * import muster, { action, call, error, ifError, ref } from '@dws/muster';
 *
 * const app = muster({
 *   getGreeting: action((name) => {
 *     if (!/[A-Za-z]+/.test(name)) {
 *       return error(`Invalid name: ${name}`);
 *     }
 *     return `Hello, ${name}`;
 *   }),
 *   getGreetingSafe: ifError('Hello, stranger', ref('getGreeting')),
 * });
 *
 * const bob = await app.resolve(call('getGreeting', ['Bob']));
 * // bob === 'Hello, Bob'
 *
 * const invalid = await app.resolve(call('getGreeting', ['123']));
 * // invalid === 'Invalid name: 123'
 *
 * const bobSafe = await app.resolve(call('getGreetingSafe', ['Bob']));
 * // bobSafe === 'Hello, Bob'
 *
 * const invalidSafe = await app.resolve(call('getGreetingSafe', ['123']));
 * // invalidSafe === 'Hello, stranger'
 * ```
 * This example shows how to use the [[ifError]] to catch action errors and replace the
 * result with a different one. Just like in the previous example, you could use the fallback
 * generator..
 */
export function ifError(
  fallback: ErrorFallbackGenerator | NodeDefinition | NodeLike,
  target: NodeDefinition | NodeLike,
): IfErrorNodeDefinition {
  return createNodeDefinition(IfErrorNodeType, {
    fallback: parseFallbackGenerator(fallback),
    target: isNodeDefinition(target) ? target : value(target),
  });
}

export function isIfErrorNodeDefinition(value: NodeDefinition): value is IfErrorNodeDefinition {
  return value.type === IfErrorNodeType;
}

function parseFallbackGenerator(
  factory: ErrorFallbackGenerator | NodeDefinition | NodeLike,
): ErrorFallbackGenerator {
  if (typeof factory === 'function') {
    return (error: ErrorNodeDefinition, previousValue: NodeDefinition | undefined) =>
      toValue(factory(error, previousValue));
  }
  if (isNodeDefinition(factory)) {
    return () => factory;
  }
  const fallback = toValue(factory);
  return () => fallback;
}
