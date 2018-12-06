import {
  NodeDefinition,
  StaticGraphNode,
  StaticNodeDefinition,
  StaticNodeType,
} from '../../../types/graph';
import createNodeDefinition from '../../../utils/create-node-definition';
import { createNodeType } from '../../../utils/create-node-type';

/**
 * An instance of the [[last]] node.
 * See the [[last]] documentation to find out more.
 */
export interface LastNode extends StaticGraphNode<'last'> {}

/**
 * A definition of the [[last]] node.
 * See the [[last]] documentation to find out more.
 */
export interface LastNodeDefinition extends StaticNodeDefinition<'last'> {}

/**
 * An implementation of the [[last]] node.
 * See the [[last]] documentation to find out more.
 */
export const LastNodeType: StaticNodeType<'last'> = createNodeType<'last'>('last');

const INSTANCE = createNodeDefinition(LastNodeType, {});

/**
 * Creates a new instance of the [[last]] node, which can be used as part of a [[ref]] to request a last item
 * of a given collection.
 *
 * @example **Get last primitive item from a collection**
 * ```js
 * import muster, { last, ref } from '@dws/muster';
 *
 * const app = muster({
 *   numbers: [1, 2, 3],
 * });
 *
 * await app.resolve(ref('numbers', last())); // === 3
 * ```
 * This example shows how to get the last item from the collection, when the collection contains only primitive items.
 *
 *
 * @example **Query the last item from a collection**
 * ```js
 * import muster, { key, last, query, ref } from '@dws/muster';
 *
 * const app = muster({
 *   people: [
 *     { firstName: 'Bob', lastName: 'Smith' },
 *     { firstName: 'Jane', lastName: 'Jonson' },
 *     { firstName: 'Sabine', lastName: 'Summers' },
 *   ],
 * });
 *
 * await app.resolve(query(ref('people', last()), {
 *   firstName: key('firstName'),
 *   lastName: key('lastName'),
 * })); // === { firstName: 'Sabine', lastName: 'Summers' }
 * ```
 * This example shows how to get the last item from the collection, when the collection contains [[tree]] nodes.
 */
export function last(): LastNodeDefinition {
  return INSTANCE;
}

export function isLastNodeDefinition(value: NodeDefinition): value is LastNodeDefinition {
  return value.type === LastNodeType;
}
