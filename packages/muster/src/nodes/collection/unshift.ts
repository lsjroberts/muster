import once from 'lodash/once';
import {
  GraphAction,
  GraphNode,
  NodeDefinition,
  NodeDependency,
  NodeLike,
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
import { toValue } from '../graph/value';
import { supportsUnshiftOperation, unshiftOperation } from './operations/unshift';

/**
 * An instance of the [[unshift]] node.
 * See the [[unshift]] documentation to find out more.
 */
export interface UnshiftNode extends StatefulGraphNode<'unshift', UnshiftNodeProperties> {}

/**
 * A definition of the [[unshift]] node.
 * See the [[unshift]] documentation to find out more.
 */
export interface UnshiftNodeDefinition
  extends StatefulNodeDefinition<'unshift', UnshiftNodeProperties> {}

export interface UnshiftNodeProperties {
  item: NodeDefinition;
  target: NodeDefinition;
}

export interface UnshiftNodeState {
  memoized: (targetNode: GraphNode, item: NodeDefinition) => GraphAction;
}

/**
 * The implementation of the [[unshift]].
 * See the [[unshift]] documentation for more information.
 */
export const UnshiftNodeType: StatefulNodeType<
  'unshift',
  UnshiftNodeProperties,
  UnshiftNodeState,
  {}
> = createNodeType<'unshift', UnshiftNodeProperties, UnshiftNodeState, {}>('unshift', {
  shape: {
    item: graphTypes.nodeDefinition,
    target: graphTypes.nodeDefinition,
  },
  state: {
    memoized: types.saveHash(types.func),
  },
  getInitialState() {
    return {
      memoized: once((target: GraphNode, item: NodeDefinition) =>
        createGraphAction(target, unshiftOperation(item)),
      ),
    };
  },
  operations: {
    evaluate: {
      cacheable: false,
      getDependencies({ target }: UnshiftNodeProperties): Array<NodeDependency> {
        return [
          {
            target,
            until: untilSupportsUnshiftOperation,
          },
        ];
      },
      run(
        node: UnshiftNode,
        options: never,
        [target]: [GraphNode],
        context: never,
        state: UnshiftNodeState,
      ): GraphAction {
        return state.memoized(target, node.definition.properties.item);
      },
    },
  },
});

const untilSupportsUnshiftOperation = {
  predicate: supportsUnshiftOperation,
  errorMessage(node: GraphNode) {
    return getInvalidTypeErrorMessage('Target node does not allow collection mutations (unshift)', {
      received: node.definition,
    });
  },
};

/**
 * Creates an instance of an [[unshift]], which is a type of a graph node used when unshifting a new item into a mutable collection.
 * It works in a similar way to `Array.unshift(...)` function from JavaScript.
 *
 *
 * @example **Unshift a number to a mutable collection**
 * ```js
 * import muster, { arrayList, entries, unshift, query, ref } from '@dws/muster';
 *
 * const app = muster({
 *   numbers: arrayList([1, 2, 3]),
 * });
 *
 * app.resolve(query(ref('numbers'), entries())).subscribe((value) => {
 *   console.log(value);
 * });
 *
 * await app.resolve(unshift(ref('numbers'), 5));
 *
 * // Console output:
 * // [1, 2, 3]
 * // [5, 1, 2, 3]
 * ```
 * This example shows how to add a new item at the beginning of a mutable collection.
 *
 *
 * @example **Unshift a branch to a mutable collection**
 * ```js
 * import muster, { arrayList, entries, key, unshift, query, ref, toNode } from '@dws/muster';
 *
 * const app = muster({
 *   people: arrayList([
 *     { firstName: 'Lizzie', lastName: 'Ramirez' },
 *     { firstName: 'Charlotte', lastName: 'Schneider' },
 *   ]),
 * });
 *
 * app.resolve(query(ref('people'), entries({
 *   firstName: key('firstName'),
 * }))).subscribe((value) => {
 *   console.log(value);
 * });
 *
 * await app.resolve(
 *   unshift(ref('people'), toNode({ firstName: 'Genevieve', lastName: 'Patrick' })),
 * );
 *
 * // Console output:
 * // [{ firstName: 'Lizzie' }, { firstName: 'Charlotte' }]
 * // [{ firstName: 'Genevieve' }, { firstName: 'Lizzie' }, { firstName: 'Charlotte' }]
 * ```
 * This example shows how to add a new branch at the beginning of a mutable collection.
 */
export function unshift(target: NodeDefinition, item: NodeLike): UnshiftNodeDefinition {
  return createNodeDefinition(UnshiftNodeType, {
    item: toValue(item),
    target,
  });
}
