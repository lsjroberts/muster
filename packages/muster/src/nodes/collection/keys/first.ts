import {
  NodeDefinition,
  StaticGraphNode,
  StaticNodeDefinition,
  StaticNodeType,
} from '../../../types/graph';
import createNodeDefinition from '../../../utils/create-node-definition';
import { createNodeType } from '../../../utils/create-node-type';

/**
 * An instance of the [[first]] node.
 * See the [[first]] documentation to find out more.
 */
export interface FirstNode extends StaticGraphNode<'first'> {}

/**
 * A definition of the [[first]] node.
 * See the [[first]] documentation to find out more.
 */
export interface FirstNodeDefinition extends StaticNodeDefinition<'first'> {}

/**
 * An implementation of the [[first]] node.
 * See the [[first]] documentation to find out more.
 */
export const FirstNodeType: StaticNodeType<'first'> = createNodeType<'first'>('first');

const INSTANCE = createNodeDefinition(FirstNodeType, {});

/**
 * Creates a new instance of the [[first]] node, which can be used as part of a [[ref]] to request a first item
 * of a given collection.
 *
 * @example **Get first primitive item from a collection**
 * ```js
 * import muster, { first, ref } from '@dws/muster';
 *
 * const app = muster({
 *   numbers: [1, 2, 3],
 * });
 *
 * await app.resolve(ref('numbers', first())); // === 1
 * ```
 * This example shows how to get the first item from the collection, when the collection contains only primitive items.
 *
 *
 * @example **Query the first item from a collection**
 * ```js
 * import muster, { first, key, query, ref } from '@dws/muster';
 *
 * const app = muster({
 *   people: [
 *     { firstName: 'Bob', lastName: 'Smith' },
 *     { firstName: 'Jane', lastName: 'Jonson' },
 *     { firstName: 'Sabine', lastName: 'Summers' },
 *   ],
 * });
 *
 * await app.resolve(query(ref('people', first()), {
 *   firstName: key('firstName'),
 *   lastName: key('lastName'),
 * })); // === { firstName: 'Bob', lastName: 'Smith' }
 * ```
 * This example shows how to get the first item from the collection, when the collection contains [[tree]] nodes.
 */
export function first(): FirstNodeDefinition {
  return INSTANCE;
}

export function isFirstNodeDefinition(value: NodeDefinition): value is FirstNodeDefinition {
  return value.type === FirstNodeType;
}
