import {
  GraphAction,
  GraphNode,
  NodeDefinition,
  NodeDependency,
  StatelessGraphNode,
  StatelessNodeDefinition,
  StatelessNodeType,
} from '../../types/graph';
import createGraphAction from '../../utils/create-graph-action';
import createNodeDefinition from '../../utils/create-node-definition';
import { createNodeType } from '../../utils/create-node-type';
import { getInvalidTypeErrorMessage } from '../../utils/get-invalid-type-error';
import * as graphTypes from '../../utils/graph-types';
import { ValueNode } from '../graph/value';
import { clearOperation, supportsClearOperation } from './operations/clear';

/**
 * An instance of the [[clear]] node.
 * See the [[clear]] documentation to find out more.
 */
export interface ClearNode extends StatelessGraphNode<'clear', ClearNodeProperties> {}

/**
 * A definition of the [[clear]] node.
 * See the [[clear]] documentation for more information.
 */
export interface ClearNodeDefinition
  extends StatelessNodeDefinition<'clear', ClearNodeProperties> {}

export interface ClearNodeProperties {
  target: NodeDefinition;
}

/**
 * The implementation of the [[clear]] node.
 * See the [[clear]] documentation for more information.
 */
export const ClearNodeType: StatelessNodeType<'clear', ClearNodeProperties> = createNodeType<
  'clear',
  ClearNodeProperties
>('clear', {
  shape: {
    target: graphTypes.nodeDefinition,
  },
  operations: {
    evaluate: {
      cacheable: false,
      getDependencies({ target }: ClearNodeProperties): [NodeDependency] {
        return [
          {
            target,
            until: untilSupportsClearOperation,
          },
        ];
      },
      run(
        node: ClearNode,
        options: never,
        [target]: [GraphNode, ValueNode<number>],
        context: never,
      ): GraphAction {
        return createGraphAction(target, clearOperation());
      },
    },
  },
});

const untilSupportsClearOperation = {
  predicate: supportsClearOperation,
  errorMessage(node: GraphNode) {
    return getInvalidTypeErrorMessage('Target node does not allow collection mutations (clear)', {
      received: node.definition,
    });
  },
};

/**
 * Creates a [[clear]] node, which is a type of a [[NodeDefinition]] used when clearing an [[arrayList]] node.
 *
 * @example **Clear an arrayList**
 * ```js
 * import muster, { arrayList, clear, entries, query, ref } from '@dws/muster';
 *
 * const app = muster({
 *   items: [1, 2, 3],
 * });
 *
 * // Check the arrayList before clearing it
 * await app.resolve(query(ref('items'), entries()));
 * // === [1, 2, 3];
 *
 * await app.resolve(clear(ref('items')));
 *
 * // Check the arrayList after clearing it
 * await app.resolve(query(ref('items'), entries()));
 * // === []
 * ```
 * This example shows how to use the [[clear]] node to clear the [[arrayList]].
 */
export function clear(target: NodeDefinition): ClearNodeDefinition {
  return createNodeDefinition(ClearNodeType, {
    target,
  });
}
