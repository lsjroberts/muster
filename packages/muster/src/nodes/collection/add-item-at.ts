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
import { untilIntegerValueNode } from '../../utils/is-integer-value-node';
import * as types from '../../utils/types';
import { toValue, ValueNode } from '../graph/value';
import { addItemAtOperation, supportsAddItemAtOperation } from './operations/add-item-at';

/**
 * An instance of the [[addItemAt]] node.
 * See the [[addItemAt]] documentation to find out more.
 */
export interface AddItemAtNode extends StatefulGraphNode<'add-item-at', AddItemAtNodeProperties> {}

/**
 * A definition of the [[addItemAt]] node.
 * See the [[addItemAt]] documentation to find out more.
 */
export interface AddItemAtNodeDefinition
  extends StatefulNodeDefinition<'add-item-at', AddItemAtNodeProperties> {}

export interface AddItemAtNodeProperties {
  index: NodeDefinition;
  item: NodeDefinition;
  target: NodeDefinition;
}

export interface AddItemAtNodeState {
  memoized: (targetNode: GraphNode, item: NodeDefinition, index: number) => GraphAction;
}

/**
 * The implementation of the [[addItemAt]] node.
 * See the [[addItemAt]] documentation for more information.
 */
export const AddItemAtNodeType: StatefulNodeType<
  'add-item-at',
  AddItemAtNodeProperties,
  AddItemAtNodeState,
  {}
> = createNodeType<'add-item-at', AddItemAtNodeProperties, AddItemAtNodeState, {}>('add-item-at', {
  shape: {
    index: graphTypes.nodeDefinition,
    item: graphTypes.nodeDefinition,
    target: graphTypes.nodeDefinition,
  },
  state: {
    memoized: types.saveHash(types.func),
  },
  getInitialState() {
    return {
      memoized: once((target: GraphNode, item: NodeDefinition, index: number) =>
        createGraphAction(target, addItemAtOperation(item, index)),
      ),
    };
  },
  operations: {
    evaluate: {
      cacheable: false,
      getDependencies({ target, index }: AddItemAtNodeProperties): Array<NodeDependency> {
        return [
          {
            target,
            until: untilSupportsAddItemAtOperation,
          },
          {
            target: index,
            until: untilIntegerValueIndex,
          },
        ];
      },
      run(
        node: AddItemAtNode,
        options: never,
        [target, index]: [GraphNode, ValueNode<number>],
        context: never,
        state: AddItemAtNodeState,
      ): GraphAction {
        const { item } = node.definition.properties;
        return state.memoized(target, item, index.definition.properties.value);
      },
    },
  },
});

const untilSupportsAddItemAtOperation = {
  predicate: supportsAddItemAtOperation,
  errorMessage(node: GraphNode) {
    return getInvalidTypeErrorMessage(
      'Target node does not allow collection mutations (addItemAt)',
      { received: node.definition },
    );
  },
};

const untilIntegerValueIndex = untilIntegerValueNode(AddItemAtNodeType, 'index');

/**
 * Creates an instance of an [[addItemAt]] node, which is a type of a graph node used when inserting an item into
 * a mutable collection at a specific index.
 *
 *
 * @example **Insert a number to a mutable collection**
 * ```js
 * import muster, { addItemAt, arrayList, entries, query, ref } from '@dws/muster';
 *
 * const app = muster({
 *   numbers: arrayList([1, 2, 3]),
 * });
 *
 * app.resolve(query(ref('numbers'), entries())).subscribe((value) => {
 *   console.log(value);
 * });
 *
 * await app.resolve(addItemAt(ref('numbers'), 5, 1));
 *
 * // Console output:
 * // [1, 2, 3]
 * // [1, 5, 2, 3]
 * ```
 * This example shows how to insert a new item to a mutable collection.
 *
 *
 * @example **Insert a branch to a mutable collection**
 * ```js
 * import muster, { addItemAt, arrayList, entries, key, query, ref, toNode } from '@dws/muster';
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
 *   addItemAt(ref('people'), toNode({ firstName: 'Genevieve', lastName: 'Patrick' }), 1),
 * );
 *
 * // Console output:
 * // [{ firstName: 'Lizzie' }, { firstName: 'Charlotte' }]
 * // [{ firstName: 'Lizzie' }, { firstName: 'Genevieve' }, { firstName: 'Charlotte' }]
 * ```
 * This example shows how to insert a new branch to a mutable collection.
 */
export function addItemAt(
  target: NodeDefinition,
  item: NodeLike,
  index: NodeLike,
): AddItemAtNodeDefinition {
  return createNodeDefinition(AddItemAtNodeType, {
    index: toValue(index),
    item: toValue(item),
    target,
  });
}
