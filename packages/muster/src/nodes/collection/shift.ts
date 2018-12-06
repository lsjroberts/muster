import {
  GraphNode,
  NodeDefinition,
  NodeExecutionContext,
  StatefulGraphNode,
  StatefulNodeDefinition,
  StatefulNodeType,
} from '../../types/graph';
import createGraphAction from '../../utils/create-graph-action';
import createNodeDefinition from '../../utils/create-node-definition';
import { createNodeType } from '../../utils/create-node-type';
import { getInvalidTypeErrorMessage } from '../../utils/get-invalid-type-error';
import * as graphTypes from '../../utils/graph-types';
import * as types from '../../utils/types';
import withScopeFrom from '../../utils/with-scope-from';
import { resolve } from '../graph/resolve';
import { shiftOperation, supportsShiftOperation } from './operations/shift';

/**
 * An instance of the [[shift]] node.
 * See the [[shift]] documentation to find out more.
 */
export interface ShiftNode extends StatefulGraphNode<'shift', ShiftNodeProperties> {}

/**
 * A definition of the [[shift]] node.
 * See the [[shift]] documentation to find out more.
 */
export interface ShiftNodeDefinition extends StatefulNodeDefinition<'shift', ShiftNodeProperties> {}

export interface ShiftNodeProperties {
  id: number;
  target: NodeDefinition;
}

export interface ShiftNodeState {
  currentValue: GraphNode | undefined;
}

/**
 * The implementation of the [[shift]] node.
 * See the [[shift]] documentation for more information.
 */
export const ShiftNodeType: StatefulNodeType<
  'shift',
  ShiftNodeProperties,
  ShiftNodeState,
  {}
> = createNodeType<'shift', ShiftNodeProperties, ShiftNodeState, {}>('shift', {
  shape: {
    id: types.number,
    target: graphTypes.nodeDefinition,
  },
  state: {
    currentValue: types.optional(graphTypes.nodeDefinition),
  },
  getInitialState() {
    return {
      currentValue: undefined,
    };
  },
  operations: {
    evaluate: {
      cacheable: false,
      run(
        node: ShiftNode,
        options: never,
        dependencies: never,
        context: never,
        state: ShiftNodeState,
      ): GraphNode {
        return state.currentValue!;
      },
      onSubscribe(this: NodeExecutionContext<ShiftNodeState, {}>, node: ShiftNode): void {
        if (this.getState().currentValue) return;
        const { target } = node.definition.properties;
        this.setState(() => ({
          currentValue: withScopeFrom(
            node,
            resolve([{ target, until: untilSupportsShiftOperation }], ([resolvedTarget]) => {
              return withScopeFrom(
                resolvedTarget,
                resolve([createGraphAction(resolvedTarget, shiftOperation())], ([result]) => {
                  this.setState(() => ({ currentValue: result }));
                  return result;
                }),
              );
            }),
          ),
        }));
      },
    },
  },
});

const untilSupportsShiftOperation = {
  predicate: supportsShiftOperation,
  errorMessage(node: GraphNode) {
    return getInvalidTypeErrorMessage('Target node does not allow collection mutations (shift)', {
      received: node.definition,
    });
  },
};

// This index is so that Muster knows that each new `shift` is different than the previous
let nextShiftId = 1;

/**
 * Creates an instance of an [[shift]], which is a type of a graph node used when shifting a last item from a mutable collection.
 * It works in a similar way to `Array.shift(...)` function from JavaScript.
 *
 *
 * @example **Shift a number from a mutable collection**
 * ```js
 * import muster, { arrayList, entries, query, ref, shift } from '@dws/muster';
 *
 * const app = muster({
 *   numbers: arrayList([3, 1, 2]),
 * });
 *
 * app.resolve(query(ref('numbers'), entries())).subscribe((numbers) => {
 *   console.log(numbers);
 * });
 *
 * await app.resolve(shift(ref('numbers'))); // === 3
 * await app.resolve(shift(ref('numbers'))); // === 1
 * await app.resolve(shift(ref('numbers'))); // === 2
 * await app.resolve(shift(ref('numbers'))); // === null
 * await app.resolve(shift(ref('numbers'))); // === null
 *
 * // Console output:
 * // [3, 1, 2]
 * // [1, 2]
 * // [2],
 * // []
 * ```
 * This example shows how to use the [[shift]] node to remove last item from the mutable
 * collection. The node resolves to a removed value or [[nil]] node, when there are
 * no more items to be shifting.
 *
 *
 * @example **Shift a branch from a mutable collection**
 * ```js
 * import muster, { array, entries, key, query, ref, shift } from '@dws/muster';
 *
 * const app = muster({
 *   people: array([
 *     { firstName: 'Lizzie', lastName: 'Ramirez' },
 *     { firstName: 'Charlotte', lastName: 'Schneider' },
 *     { firstName: 'Genevieve', lastName: 'Patrick' },
 *   ]),
 * });
 *
 * app.resolve(query(ref('numbers'), entries({
 *   firstName: key('firstName'),
 * }))).subscribe((people) => {
 *   console.log(people);
 * });
 *
 * await app.resolve(shift(ref('people'))); // === { firstName: 'Lizzie', lastName: 'Ramirez' }
 * await app.resolve(shift(ref('people'))); // === { firstName: 'Charlotte', lastName: 'Schneider' }
 * await app.resolve(shift(ref('people'))); // === { firstName: 'Genevieve', lastName: 'Patrick' }
 * await app.resolve(shift(ref('people'))); // === null
 * await app.resolve(shift(ref('people'))); // === null
 *
 * // Console output:
 * // [{ firstName: 'Lizzie' }, { firstName: 'Charlotte' }, { firstName: 'Genevieve' }]
 * // [{ firstName: 'Charlotte' }, { firstName: 'Genevieve' }]
 * // [{ firstName: 'Genevieve' }]
 * // []
 * ```
 */
export function shift(target: NodeDefinition): ShiftNodeDefinition {
  return createNodeDefinition(ShiftNodeType, {
    // This ID is here to uniquely identify the node.
    id: nextShiftId++, // tslint:disable-line:no-increment-decrement
    target,
  });
}
