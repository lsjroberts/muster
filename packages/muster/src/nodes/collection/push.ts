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
import { pushOperation, supportsPushOperation } from './operations/push';

/**
 * An instance of the [[push]] node.
 * See the [[push]] documentation to find out more.
 */
export interface PushNode extends StatefulGraphNode<'push', PushNodeProperties> {}

/**
 * A definition of the [[push]] node.
 * See the [[push]] documentation to find out more.
 */
export interface PushNodeDefinition extends StatefulNodeDefinition<'push', PushNodeProperties> {}

export interface PushNodeProperties {
  item: NodeDefinition;
  target: NodeDefinition;
}

export interface PushNodeState {
  memoized: (targetNode: GraphNode, item: NodeDefinition) => GraphAction;
}

/**
 * The implementation of the [[push]].
 * See the [[push]] documentation for more information.
 */
export const PushNodeType: StatefulNodeType<
  'push',
  PushNodeProperties,
  PushNodeState,
  {}
> = createNodeType<'push', PushNodeProperties, PushNodeState, {}>('push', {
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
        createGraphAction(target, pushOperation(item)),
      ),
    };
  },
  operations: {
    evaluate: {
      cacheable: false,
      getDependencies({ target }: PushNodeProperties): Array<NodeDependency> {
        return [
          {
            target,
            until: untilSupportsPushOperation,
          },
        ];
      },
      run(
        node: PushNode,
        options: never,
        [target]: [GraphNode],
        context: never,
        state: PushNodeState,
      ): GraphAction {
        return state.memoized(target, node.definition.properties.item);
      },
    },
  },
});

const untilSupportsPushOperation = {
  predicate: supportsPushOperation,
  errorMessage(node: GraphNode) {
    return getInvalidTypeErrorMessage('Target node does not allow collection mutations (push)', {
      received: node.definition,
    });
  },
};

/**
 * Creates an instance of an [[push]], which is a type of a graph node used when pushing a new item into a mutable collection.
 * It works in a similar way to `Array.push(...)` function from JavaScript.
 *
 *
 * @example **Push a number to a mutable collection**
 * ```js
 * import muster, { arrayList, entries, push, query, ref } from '@dws/muster';
 *
 * const app = muster({
 *   numbers: arrayList([1, 2, 3]),
 * });
 *
 * app.resolve(query(ref('numbers'), entries())).subscribe((value) => {
 *   console.log(value);
 * });
 *
 * await app.resolve(push(ref('numbers'), 5));
 *
 * // Console output:
 * // [1, 2, 3]
 * // [1, 2, 3, 5]
 * ```
 * This example shows how to add a new item at the end of a mutable collection.
 *
 *
 * @example **Push a branch to a mutable collection**
 * ```js
 * import muster, { arrayList, entries, key, push, query, ref, toNode } from '@dws/muster';
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
 *   push(ref('people'), toNode({ firstName: 'Genevieve', lastName: 'Patrick' })),
 * );
 *
 * // Console output:
 * // [{ firstName: 'Lizzie' }, { firstName: 'Charlotte' }]
 * // [{ firstName: 'Lizzie' }, { firstName: 'Charlotte' }, { firstName: 'Genevieve' }]
 * ```
 * This example shows how to add a new branch at the end of a mutable collection.
 */
export function push(target: NodeDefinition, item: NodeLike): PushNodeDefinition {
  return createNodeDefinition(PushNodeType, {
    item: toValue(item),
    target,
  });
}
