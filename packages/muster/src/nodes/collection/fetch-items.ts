import {
  getItemsOperation,
  GetItemsOperation,
  supportsGetItemsOperation,
} from '../../operations/get-items';
import {
  GraphNode,
  isGraphNode,
  NodeDefinition,
  NodeDependency,
  StaticGraphNode,
  StaticNodeDefinition,
  StaticNodeType,
} from '../../types/graph';
import createGraphAction from '../../utils/create-graph-action';
import createNodeDefinition from '../../utils/create-node-definition';
import { createNodeType } from '../../utils/create-node-type';
import { getInvalidTypeErrorMessage } from '../../utils/get-invalid-type-error';
import * as graphTypes from '../../utils/graph-types';
import withScopeFrom from '../../utils/with-scope-from';
import { NilNodeType } from '../graph/nil';
import { PlaceholderNodeType } from '../graph/placeholder';
import { resolve } from '../graph/resolve';
import { traverse } from '../graph/traverse';
import { ArrayNodeType } from './array';
import { nodeList, NodeListNode, NodeListNodeType } from './node-list';
import { transformItems } from './operations/transform-items';

/**
 * An instance of the [[fetchItems]] node.
 * See the [[fetchItems]] documentation to find out more.
 */
export interface FetchItemsNode extends StaticGraphNode<'fetch-items', FetchItemsNodeProperties> {}

/**
 * A definition of the [[fetchItems]] node.
 * See the [[fetchItems]] documentation to find out more.
 */
export interface FetchItemsNodeDefinition
  extends StaticNodeDefinition<'fetch-items', FetchItemsNodeProperties> {}

export interface FetchItemsNodeProperties {
  target: NodeDefinition;
}

/**
 * An implementation of the [[fetchItems]] node.
 * See the [[fetchItems]] documentation to find out more.
 */
export const FetchItemsNodeType: StaticNodeType<
  'fetch-items',
  FetchItemsNodeProperties
> = createNodeType<'fetch-items', FetchItemsNodeProperties>('fetch-items', {
  shape: {
    target: graphTypes.nodeDefinition,
  },
  operations: {
    getItems: {
      getDependencies({ target }: FetchItemsNodeProperties): Array<NodeDependency> {
        return [
          {
            target,
            until: untilSupportsGetItemOperation,
          },
        ];
      },
      run(node: FetchItemsNode, operation: GetItemsOperation, [target]: [GraphNode]) {
        if (NilNodeType.is(target)) return target;
        const { transforms } = operation.properties;
        return resolve(
          [{ target: traverse(target, getItemsOperation()), until: untilPlaceholderOrItems }],
          ([items]: [GraphNode]) => {
            if (NilNodeType.is(items)) return items;
            if (!PlaceholderNodeType.is(items)) {
              return createGraphAction(items, getItemsOperation(transforms));
            }
            return applyTransforms(
              withScopeFrom(items, nodeList([items])) as NodeListNode,
              transforms,
            );
          },
        );
      },
    },
  },
});

/**
 * Creates a new instance of the [[fetchItems]] node. This node can be used to create collection transform boundaries
 * by making sure that the transforms sent to the [[fetchItems]] node get run only after the target gets fully resolved.
 *
 *
 * @example **Map transform that returns a computed node**
 * ```js
 * import muster, {
 *   applyTransforms,
 *   computed,
 *   entries,
 *   extend,
 *   fetchItems,
 *   fromStreamMiddleware,
 *   get,
 *   key,
 *   map,
 *   query,
 *   proxy,
 *   ref,
 * } from '@dws/muster';
 *
 * const remoteInstance = muster({
 *   people: [
 *     { firstName: 'Bob', lastName: 'Smith' },
 *     { firstName: 'Jane', lastName: 'Jonson' },
 *     { firstName: 'Sabine', lastName: 'Summers' },
 *   ],
 * });
 *
 * const app = muster({
 *   remote: proxy([
 *     fromStreamMiddleware((req) => remoteInstance.resolve(req, { raw: true })),
 *   ]),
 *   peopleWithFullNames: applyTransforms(
 *     fetchItems(ref('remote', 'people')),
 *     [
 *       map((user) => extend(user, {
 *         fullName: computed(
 *           [get(user, 'firstName'), get(user, 'lastName')],
 *           (first, last) => `${first} ${last}`,
 *         ),
 *       })),
 *     ],
 *   ),
 * });
 *
 * await app.resolve(query(ref('peopleWithFullNames'), {
 *   fullName: key('fullName')
 * })); // === [{ fullName: Bob Smith'' }, { fullName: 'Jane Jonson' }, { fullName: 'Sabine Summers' }]
 * ```
 * This example shows how to use a [[fetchItems]] to create a boundary for transforms. Note that the `peopleWithFullNames`
 * node uses a [[map]] with a [[computed]] node, which can't be serialised and sent over to the remote instance of muster.
 * For this reason we have to wrap the remote collection in a [[fetchItems]] node.
 */
export function fetchItems(target: NodeDefinition): FetchItemsNodeDefinition {
  return createNodeDefinition(FetchItemsNodeType, { target });
}

export function isFetchItemsNodeDefinition(
  fetchItems: NodeDefinition,
): fetchItems is FetchItemsNodeDefinition {
  return fetchItems.type === FetchItemsNodeType;
}

const untilPlaceholderOrItems = {
  predicate(node: GraphNode) {
    return (
      PlaceholderNodeType.is(node) ||
      ArrayNodeType.is(node) ||
      NodeListNodeType.is(node) ||
      NilNodeType.is(node)
    );
  },
};

const untilSupportsGetItemOperation = {
  predicate: supportsGetItemsOperation,
  errorMessage(node: GraphNode) {
    return getInvalidTypeErrorMessage('Target node does not support getItems operation.', {
      received: node.definition,
    });
  },
};

function applyTransforms(
  target: NodeListNode,
  transforms: Array<GraphNode | NodeDefinition>,
): GraphNode {
  if (transforms.length === 0) {
    if (PlaceholderNodeType.is(target.definition.properties.items[0])) {
      return target.definition.properties.items[0];
    }
    return target;
  }
  const transform: GraphNode = isGraphNode(transforms[0])
    ? (transforms[0] as GraphNode)
    : withScopeFrom(target, transforms[0] as NodeDefinition);
  return withScopeFrom(
    target,
    resolve(
      [createGraphAction(transform, transformItems(target.definition.properties.items))],
      ([result]) => {
        return withScopeFrom(
          result,
          resolve([{ target: result.definition }], ([transformedItems]: [NodeListNode]) => {
            const nextTarget =
              transformedItems.definition.properties.items.length > 0 ? transformedItems : target;
            return applyTransforms(nextTarget, transforms.slice(1));
          }),
        );
      },
    ),
  );
}
