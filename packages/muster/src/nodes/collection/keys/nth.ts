import {
  NodeDefinition,
  StaticGraphNode,
  StaticNodeDefinition,
  StaticNodeType,
} from '../../../types/graph';
import createNodeDefinition from '../../../utils/create-node-definition';
import { createNodeType } from '../../../utils/create-node-type';
import * as types from '../../../utils/types';

/**
 * An instance of the [[nth]] node.
 * See the [[nth]] documentation to find out more.
 */
export interface NthNode extends StaticGraphNode<'nth', NthNodeProperties> {}

/**
 * A definition of the [[nth]] node.
 * See the [[nth]] documentation to find out more.
 */
export interface NthNodeDefinition extends StaticNodeDefinition<'nth', NthNodeProperties> {}

export interface NthNodeProperties {
  index: number;
}

/**
 * An implementation of the [[nth]] node.
 * See the [[nth]] documentation to find out more.
 */
export const NthNodeType: StaticNodeType<'nth', NthNodeProperties> = createNodeType<
  'nth',
  NthNodeProperties
>('nth', {
  shape: {
    index: types.number,
  },
});

/**
 * Creates a new instance of the [[nth]] node, which can be used as part of a [[ref]] to request a specific item
 * of a given collection.
 *
 * @example **Get the second primitive item from a collection**
 * ```js
 * import muster, { nth, ref } from '@dws/muster';
 *
 * const app = muster({
 *   numbers: [1, 2, 3],
 * });
 *
 * await app.resolve(ref('numbers', nth(1))); // === 2
 * ```
 * This example shows how to get the second item from the collection, when the collection contains only primitive items.
 *
 *
 * @example **Query the second item from a collection**
 * ```js
 * import muster, { key, nth, query, ref } from '@dws/muster';
 *
 * const app = muster({
 *   people: [
 *     { firstName: 'Bob', lastName: 'Smith' },
 *     { firstName: 'Jane', lastName: 'Jonson' },
 *     { firstName: 'Sabine', lastName: 'Summers' },
 *   ],
 * });
 *
 * await app.resolve(query(ref('people', nth(1)), {
 *   firstName: key('firstName'),
 *   lastName: key('lastName'),
 * })); // === { firstName: 'Jane', lastName: 'Jonson' }
 * ```
 * This example shows how to get the second item from the collection, when the collection contains [[tree]] nodes.
 */
export function nth(index: number): NthNodeDefinition {
  return createNodeDefinition(NthNodeType, {
    index,
  });
}

export function isNthNodeDefinition(value: NodeDefinition): value is NthNodeDefinition {
  return value.type === NthNodeType;
}
