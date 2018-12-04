import { evaluateOperation } from '../../operations';
import { getChildOperation, GetChildOperation } from '../../operations/get-child';
import {
  ChildKey,
  GraphNode,
  NodeDefinition,
  NodeLike,
  StatelessGraphNode,
  StatelessNodeDefinition,
  StatelessNodeType,
} from '../../types/graph';
import createGraphAction from '../../utils/create-graph-action';
import createNodeDefinition from '../../utils/create-node-definition';
import { createNodeType } from '../../utils/create-node-type';
import getType from '../../utils/get-type';
import * as graphTypes from '../../utils/graph-types';
import { toNode } from '../../utils/to-node';
import * as types from '../../utils/types';
import withScopeFrom from '../../utils/with-scope-from';
import { ErrorNode } from './error';
import { fuzzyTraverse } from './fuzzy-traverse';
import { isNotFoundNode, notFound } from './not-found';
import { resolve } from './resolve';

/**
 * An instance of the [[extend]] node.
 * See the [[extend]] documentation to find out more.
 */
export interface ExtendNode extends StatelessGraphNode<'extend', ExtendNodeProperties> {}

/**
 * A definition of the [[extend]] node.
 * See the [[extend]] documentation to find out more.
 */
export interface ExtendNodeDefinition
  extends StatelessNodeDefinition<'extend', ExtendNodeProperties> {}

export interface ExtendNodeProperties {
  nodes: Array<NodeDefinition>;
}

/**
 * The implementation of the [[extend]].
 * See the [[extend]] documentation to learn more.
 */
export const ExtendNodeType: StatelessNodeType<'extend', ExtendNodeProperties> = createNodeType<
  'extend',
  ExtendNodeProperties
>('extend', {
  shape: {
    nodes: types.arrayOf(graphTypes.nodeDefinition),
  },
  operations: {
    getChild: {
      run(node: ExtendNode, operation: GetChildOperation): NodeDefinition {
        return resolveChildNode(node, node.definition.properties.nodes, operation.properties.key);
      },
    },
  },
});

/**
 * Creates a new instance of a [[extend]] node, which is a type of a [[NodeDefinition]] used when extending a branch
 * with additional nodes. It can be compared to `Object.assign` but for branches.
 *
 * @example **Extend an existing branch**
 * ```js
 * import muster, { extend, key, query, ref, tree, value } from '@dws/muster';
 *
 * const app = muster({
 *   user: {
 *     firstName: 'Bob',
 *     lastName: 'Roberson',
 *   },
 *   extendedUser: extend(
 *     ref('user'),
 *     tree({
 *       age: value(29),
 *     }),
 *   ),
 * });
 *
 * const user = await app.resolve(query(ref('extendedUser'), {
 *   firstName: key('firstName'),
 *   lastName: key('lastName'),
 *   age: key('age'),
 * }));
 * // user = {
 * //   firstName: 'Bob',
 * //   lastName: 'Roberson',
 * //   age: 29,
 * // }
 * ```
 * This example shows how to use the [[extend]] to add additional nodes to an existing branch.
 */
export function extend(...nodes: Array<NodeDefinition | NodeLike>): ExtendNodeDefinition {
  return createNodeDefinition(ExtendNodeType, {
    nodes: nodes.map((node) => toNode(node)),
  });
}

export function isExtendNodeDefinition(value: NodeDefinition): value is ExtendNodeDefinition {
  return value.type === ExtendNodeType;
}

function resolveChildNode(
  node: GraphNode,
  parentNodes: Array<NodeDefinition>,
  key: ChildKey,
): NodeDefinition {
  if (parentNodes.length === 0) {
    return notFound(`Invalid child key: ${getType(key)}`);
  }
  const currentNode = parentNodes[parentNodes.length - 1];
  const remainingNodes = parentNodes.slice(0, parentNodes.length - 1);
  return resolve(
    [
      createGraphAction(
        withScopeFrom(node, fuzzyTraverse(currentNode, getChildOperation(key))),
        evaluateOperation(),
      ),
    ],
    ([childNode]: [GraphNode | ErrorNode]) => {
      if (!isNotFoundNode(childNode)) {
        return childNode;
      }
      return withScopeFrom(node, resolveChildNode(node, remainingNodes, key));
    },
  );
}
