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
import { popOperation, supportsPopOperation } from './operations/pop';

/**
 * An instance of the [[pop]] node.
 * See the [[pop]] documentation to find out more.
 */
export interface PopNode extends StatefulGraphNode<'pop', PopNodeProperties> {}

/**
 * A definition of the [[pop]] node.
 * See the [[pop]] documentation to find out more.
 */
export interface PopNodeDefinition extends StatefulNodeDefinition<'pop', PopNodeProperties> {}

export interface PopNodeProperties {
  id: number;
  target: NodeDefinition;
}

export interface PopNodeState {
  currentValue: GraphNode | undefined;
}

/**
 * The implementation of the [[pop]].
 * See the [[pop]] documentation for more information.
 */
export const PopNodeType: StatefulNodeType<
  'pop',
  PopNodeProperties,
  PopNodeState,
  {}
> = createNodeType<'pop', PopNodeProperties, PopNodeState, {}>('pop', {
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
        node: PopNode,
        options: never,
        dependencies: never,
        context: never,
        state: PopNodeState,
      ): GraphNode {
        return state.currentValue!;
      },
      onSubscribe(this: NodeExecutionContext<PopNodeState, {}>, node: PopNode): void {
        if (this.getState().currentValue) return;
        const { target } = node.definition.properties;
        this.setState(() => ({
          currentValue: withScopeFrom(
            node,
            resolve([{ target, until: untilSupportsPopOperation }], ([resolvedTarget]) => {
              return withScopeFrom(
                resolvedTarget,
                resolve([createGraphAction(resolvedTarget, popOperation())], ([result]) => {
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

const untilSupportsPopOperation = {
  predicate: supportsPopOperation,
  errorMessage(node: GraphNode) {
    return getInvalidTypeErrorMessage('Target node does not allow collection mutations (pop)', {
      received: node.definition,
    });
  },
};

// This index is so that Muster knows that each new `pop` is different than the previous
let nextPopId = 1;

/**
 * Creates an instance of an [[pop]], which is a type of a graph node used when popping a last item from a mutable collection.
 * It works in a similar way to `Array.pop(...)` function from JavaScript.
 *
 *
 * @example **Pop a number from a mutable collection**
 * ```js
 * import muster, { arrayList, entries, query, ref, pop } from '@dws/muster';
 *
 * const app = muster({
 *   numbers: arrayList([3, 1, 2]),
 * });
 *
 * app.resolve(query(ref('numbers'), entries())).subscribe((numbers) => {
 *   console.log(numbers);
 * });
 *
 * await app.resolve(pop(ref('numbers'))); // === 2
 * await app.resolve(pop(ref('numbers'))); // === 1
 * await app.resolve(pop(ref('numbers'))); // === 3
 * await app.resolve(pop(ref('numbers'))); // === null
 * await app.resolve(pop(ref('numbers'))); // === null
 *
 * // Console output:
 * // [3, 1, 2]
 * // [3, 1]
 * // [3],
 * // []
 * ```
 * This example shows how to use the [[pop]] node to remove last item from the mutable
 * collection. The node resolves to a removed value or [[nil]] node, when there are
 * no more items to be popped.
 *
 *
 * @example **Pop a branch from a mutable collection**
 * ```js
 * import muster, { arrayList, entries, key, query, ref, pop } from '@dws/muster';
 *
 * const app = muster({
 *   people: arrayList([
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
 * await app.resolve(pop(ref('people'))); // === { firstName: 'Genevieve', lastName: 'Patrick' }
 * await app.resolve(pop(ref('people'))); // === { firstName: 'Charlotte', lastName: 'Schneider' }
 * await app.resolve(pop(ref('people'))); // === { firstName: 'Lizzie', lastName: 'Ramirez' }
 * await app.resolve(pop(ref('people'))); // === null
 * await app.resolve(pop(ref('people'))); // === null
 *
 * // Console output:
 * // [{ firstName: 'Lizzie' }, { firstName: 'Charlotte' }, { firstName: 'Genevieve' }]
 * // [{ firstName: 'Lizzie' }, { firstName: 'Charlotte' }]
 * // [{ firstName: 'Lizzie' }]
 * // []
 * ```
 */
export function pop(target: NodeDefinition): PopNodeDefinition {
  return createNodeDefinition(PopNodeType, {
    // This ID is here to uniquely identify the node.
    id: nextPopId++, // tslint:disable-line:no-increment-decrement
    target,
  });
}
