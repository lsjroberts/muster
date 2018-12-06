import omit from 'lodash/omit';
import { SetOperation } from '../../operations/set';
import {
  GraphNode,
  MusterEvent,
  NodeDefinition,
  NodeExecutionContext,
  NodeLike,
  StatefulNodeType,
} from '../../types/graph';
import { Matcher } from '../../types/matchers';
import createNodeDefinition from '../../utils/create-node-definition';
import { createNodeType } from '../../utils/create-node-type';
import { getInvalidTypeError } from '../../utils/get-invalid-type-error';
import getType from '../../utils/get-type';
import * as graphTypes from '../../utils/graph-types';
import * as types from '../../utils/types';
import { valueOf } from '../../utils/value-of';
import { error } from './error';
import { ok } from './ok';
import { isValueNodeDefinition, toValue } from './value';

/**
 * An instance of the [[variable]] node.
 * See the [[variable]] documentation to find out more.
 */
export interface VariableNode
  extends GraphNode<'variable', VariableNodeProperties, VariableNodeState, VariableNodeData> {}

/**
 * A definition of the [[variable]] node.
 * See the [[variable]] documentation to find out more.
 */
export interface VariableNodeDefinition
  extends NodeDefinition<'variable', VariableNodeProperties, VariableNodeState, VariableNodeData> {}

export interface VariableNodeProperties {
  initialValue: NodeDefinition;
  validator: Matcher<any, any>;
}

export interface VariableNodeState {
  currentValue: NodeDefinition | undefined;
  setResults: { [operationId: string]: NodeDefinition };
}

export interface VariableNodeData {
  disposeResetVariableListener: (() => void) | undefined;
}

/**
 * The implementation of the [[variable]] node.
 * See the [[variable]] documentation to learn more.
 */
export const VariableNodeType: StatefulNodeType<
  'variable',
  VariableNodeProperties,
  VariableNodeState,
  VariableNodeData
> = createNodeType<'variable', VariableNodeProperties, VariableNodeState, VariableNodeData>(
  'variable',
  {
    state: {
      currentValue: types.optional(graphTypes.nodeDefinition),
      setResults: types.objectOf(graphTypes.nodeDefinition),
    },
    shape: {
      initialValue: graphTypes.nodeDefinition,
      validator: types.saveHash(types.matcher),
    },
    getInitialState(): VariableNodeState {
      return {
        currentValue: undefined,
        setResults: {},
      };
    },
    operations: {
      evaluate: {
        run(
          node: VariableNode,
          operation: never,
          dependencies: Array<never>,
          context: Array<never>,
          state: VariableNodeState,
        ): NodeDefinition {
          const { currentValue } = state;
          return currentValue || node.definition.properties.initialValue;
        },
      },
      set: {
        run(
          node: VariableNode,
          operation: SetOperation,
          dependencies: never,
          context: never,
          state: VariableNodeState,
        ): NodeDefinition {
          return state.setResults[operation.id];
        },
        onSubscribe(
          this: NodeExecutionContext<VariableNodeState, VariableNodeData>,
          node: VariableNode,
          operation: SetOperation,
        ): void {
          const { currentValue: previousValue } = this.getState();
          const { validator } = node.definition.properties;
          const { value } = operation.properties;
          if (!previousValue) {
            this.retain();
            this.setData({
              disposeResetVariableListener: node.scope.events.listen((event) => {
                if (event.type !== EVENT_RESET_VARIABLE) return;
                resetVariableNode(this);
              }),
            });
          }
          // Check if the value is valid
          if (isValueNodeDefinition(value) ? validator(valueOf(value)) : validator(value)) {
            // All is good in variable world
            this.setState((state) => ({
              ...state,
              currentValue: value,
              setResults: {
                ...state.setResults,
                [operation.id]: ok(),
              },
            }));
          } else {
            // Whoops, wrong value type!
            this.setState((state) => ({
              ...state,
              setResults: {
                ...state.setResults,
                [operation.id]: error(
                  getInvalidTypeError(
                    'Could not set value of the variable node: value has an incorrect type.',
                    {
                      expected: `Value matched by ${getType(validator)}`,
                      received: value,
                    },
                  ),
                ),
              },
            }));
          }
        },
        onUnsubscribe(
          this: NodeExecutionContext<VariableNodeState, VariableNodeData>,
          node: VariableNode,
          operation: SetOperation,
        ): void {
          this.setState((state) => ({
            ...state,
            setResults: omit(state.setResults, operation.id),
          }));
        },
      },
      reset: {
        run(
          node: VariableNode,
          options: never,
          dependencies: Array<never>,
          context: Array<never>,
          state: VariableNodeState,
        ): NodeDefinition {
          return ok();
        },
        onSubscribe(
          this: NodeExecutionContext<VariableNodeState, VariableNodeData>,
          node: VariableNode,
        ): void {
          resetVariableNode(this);
        },
      },
    },
  },
);

function resetVariableNode(context: NodeExecutionContext<VariableNodeState, VariableNodeData>) {
  const { currentValue: previousValue } = context.getState();
  if (!previousValue) {
    return;
  }
  const { disposeResetVariableListener } = context.getData();
  disposeResetVariableListener && disposeResetVariableListener();
  context.setState((prevState) => ({
    ...prevState,
    currentValue: undefined,
  }));
  context.release();
}

/**
 * Creates a new instance of a [[variable]] node, which is a node that can store values.
 * Its read and write process is synchronous.
 * Each variable node has an [[initialValue]] that defines both the node's starting
 * value and its fallback when reset. See the [[reset]] and "**Resetting
 * variables**" example to learn more about resetting [[variable]]s.
 *
 * Each muster instance has a separate node cache. This cache stores the latest resolved value of a
 * [[NodeDefinition]] for as long as there's something in the application that holds a subscription
 * to it. By default Muster does not store the values for every node. The act of
 * subscribing to a node (assuming it's a dynamic node) makes a new entry in the node cache.
 * One beneficial side effect of having this node cache is higher performance. An entry in
 * the application cache can be used in a case where some other part of the application
 * requests the value for a node that already has an open subscription. To save some computation
 * Muster can then just retrieve a value from the node cache instead of trying to re-calculate the
 * value. Each node cache entry holds a subscription count. When the count reaches 0 muster removes
 * the value from the node cache.
 *
 * A [[variable]] taps into this behaviour whenever a value is set to it.
 * The act of storing a value in a [[variable]] makes a new entry in the node cache and
 * artificially increases the subscription count for that entry. This means that the
 * [[variable]] does not clear its value when the subscription count reaches 0. In order
 * for the [[variable]] to clear its value we have to force it to reset. We do that with the
 * help of a [[reset]]. See "**Resetting variables**" example to learn more about this.
 *
 * @example **Basic variable**
 * ```ts
 * import muster, { ref, set, variable } from '@dws/muster';
 *
 * const app = muster({
 *   name: variable('Bob'),
 * });
 *
 * console.log('Retrieving a name');
 * app.resolve(ref('name')).subscribe((name) => {
 *   console.log(`Name: ${name}`);
 * });
 *
 * console.log('Setting a name to John');
 * await app.resolve(set('name', 'John'));
 *
 * // Console output:
 * // Retrieving a name
 * // Name: Bob
 * // Setting a name to John
 * // Name: John
 * ```
 * This example demonstrates how the variable node can be accessed and how to change its value.
 * See the [[set]] documentation for more information about how [[set]] works.
 * Contrary to how it might look, the process of setting the value of a [[variabled]] is
 * completely synchronous. The reason why the `await` keyword is used when setting is because
 * the [resolve](../modules/_utils_resolve_.html#resolve) method returns an object implementing
 * both the [[Observable]] and Promise APIs. This is because Muster allows for the graph to be
 * spread across multiple different environments. This means that parts of the graph can exist on a
 * remote server and accessing them is not a synchronous process. Learn more about this in the
 * [[remote]] and [[proxy]] documentation.
 *
 *
 * @example **Using variables in a computed node**
 * ```ts
 * import muster, { computed, ref, set, variable } from '@dws/muster';
 *
 * const app = muster({
 *   name: variable('Bob'),
 *   greeting: computed([ref('name')], (name) => `Hello ${name}`),
 * });
 *
 * console.log('Retrieving a greeting');
 * app.resolve(ref('greeting')).subscribe((greeting) => {
 *   console.log(greeting);
 * });
 *
 * console.log('Setting a name to Jane');
 * await app.resolve(set('name', 'Jane'));
 *
 * // Console output:
 * // Retrieving a greeting
 * // Hello Bob
 * // Setting a name to Jane
 * // Hello Jane
 * ```
 *
 *
 * @example **Persistence of stored value**
 * ```js
 * import muster, { ref, set, variable } from '@dws/muster';
 *
 * const app = muster({
 *   name: variable('Bob'),
 * });
 *
 * console.log('Retrieving a name');
 * const nameSubscription = app.resolve(ref('name')).subscribe((name) => {
 *   console.log(name);
 * });
 *
 * console.log('Setting a name to Jane');
 * await app.resolve(set('name', 'Jane'));
 *
 * console.log('Unsubscribing from name');
 * nameSubscription.unsubscribe();
 *
 * app.resolve(ref('name')).subscribe((name) => {
 *   console.log(`Re-subscribed name: ${name}`);
 * });
 *
 * // Console output:
 * // Retrieving a name
 * // Bob
 * // Setting a name to Jane
 * // Jane
 * // Unsubscribing from name
 * // Re-subscribed name: Jane
 * ```
 * This example presents the persistence of [[variable]] value even after losing all
 * subscriptions.
 *
 *
 * @example **Resetting variables**
 * ```ts
 * import muster, { ref, reset, set, variable } from '@dws/muster';
 *
 * const app = muster({
 *   name: variable('Bob'),
 * });
 *
 * app.resolve(ref('name')).subscribe((name) => {
 *   console.log(name);
 * });
 *
 * console.log('Changing name to Jane');
 * await app.resolve(set('name', 'Jane'));
 *
 * console.log('Resetting name');
 * await app.resolve(reset('name'));
 *
 * // Console output:
 * // Bob
 * // Changing name to Jane
 * // Jane
 * // Resetting name
 * // Bob
 * ```
 * This example shows how to restore the [[variable]] to its initial value with the help of a
 * [[reset]].
 *
 *
 * @example **Variable validators**
 * ```js
 * import muster, { set, types, variable } from '@dws/muster';
 *
 * const app = muster({
 *   name: variable('Bob', types.string),
 * });
 *
 * await app.resolve(set('name', 'Kate')); // OK
 *
 * await app.resolve(set('name', 123)); // Error
 * ```
 * Optionally, the [[variable]] node can also define a value validator using Muster types.
 */
export function variable(
  initialValue: NodeLike,
  validator: Matcher<any, any> = types.any,
): VariableNodeDefinition {
  return createNodeDefinition(VariableNodeType, {
    initialValue: toValue(initialValue),
    validator,
  });
}

export function isVariableNodeDefinition(value: NodeDefinition): value is VariableNodeDefinition {
  return value.type === VariableNodeType;
}

export const EVENT_RESET_VARIABLE = '$$event:reset-variable';

export function resetVariablesInScope(): MusterEvent {
  return { type: EVENT_RESET_VARIABLE, payload: undefined };
}
