import {
  getProxiedNodeDefinition,
  isNodeDefinition,
  isProxiedNode,
  NodeDefinition,
  NodeLike,
  StaticGraphNode,
  StaticNodeDefinition,
  StaticNodeType,
} from '../../types/graph';
import createNodeDefinition from '../../utils/create-node-definition';
import { createNodeType } from '../../utils/create-node-type';
import * as types from '../../utils/types';
import { error } from './error';

/**
 * An instance of the [[value]] node.
 * See the [[value]] documentation to find out more.
 */
export interface ValueNode<T> extends StaticGraphNode<'value', ValueNodeProperties<T>> {}

/**
 * A definition of the [[value]] node.
 * See the [[value]] documentation to find out more.
 */
export interface ValueNodeDefinition<T>
  extends StaticNodeDefinition<'value', ValueNodeProperties<T>> {}

export interface ValueNodeProperties<T> {
  value: T;
}

/**
 * The implementation of the [[value]] node.
 * See the [[value]] documentation to learn more.
 */
export const ValueNodeType: StaticNodeType<'value', ValueNodeProperties<any>> = createNodeType<
  'value',
  ValueNodeProperties<any>
>('value', {
  shape: {
    value: types.optional(types.saveHash(types.any)),
  },
  operations: {
    length: {
      run(node: ValueNode<any>): NodeDefinition {
        const { value: currentValue } = node.definition.properties;
        if (typeof currentValue === 'string') return value(currentValue.length);
        if (Array.isArray(currentValue)) return value(currentValue.length);
        return error('This value node does not support the length operation.');
      },
    },
  },
});

/**
 * Creates a new instance of the [[value]] node, which is used for storing raw data and for sending data to other nodes.
 *
 * Use [[value]] helper to make new instance of this node.
 *
 * This node is serializable and allowed to send over-the-wire to remote instances of muster.
 * To find out more about node serialization visit the [[serialize]] documentation. Additionally,
 * check out [[proxy]] and [[remote]] for more information on how remote query execution
 * works.
 *
 *
 * @example **Creating instances of this node**
 * ```js
 * import { value } from '@dws/muster';
 *
 * value('Hello world');      // Create a value node storing a string
 * value(123);                // Create a value node storing a number
 * value({ hello: 'world' }); // Create a value node storing an object
 * ```
 *
 *
 * @example **Sending values to computed nodes**
 * ```js
 * import { computed, value } from '@dws/muster';
 *
 * computed(
 *   [value('Hello'), value('world')],
 *   (left, right) => `${left} ${right}`,
 * );
 * ```
 * In this example we have created a computed node whose task is to combine two values, left
 * and right, into one string containing both of these values separated by a space. Note the
 * value nodes are passed into the dependency section of the computed node. In this example they
 * serve as static data. One thing to note is that in this example there's one more value node being
 * implicitly created. Because everything in muster graph must be a node, the return value of the
 * computed node is converted to a value node.
 *
 * More explicit definition of this computed node could look like this:
 * ```js
 * import { computed, value } from '@dws/muster';
 *
 * computed(
 *   [value('Hello'), value('world')],
 *   (left, right) => value(`${left} ${right}`),
 * );
 * ```
 * To find out more about the [[computed]], visit its documentation.
 */
export function value<T>(data: T): ValueNodeDefinition<T> {
  return createNodeDefinition(ValueNodeType, { value: data });
}

export function isValueNodeDefinition(value: NodeDefinition): value is ValueNodeDefinition<any> {
  return value.type === ValueNodeType;
}

export function toValue<T extends NodeDefinition>(node: T): T;
export function toValue<T extends NodeLike>(node: T): ValueNodeDefinition<T>;
export function toValue<T extends NodeDefinition, V extends NodeLike>(
  node: T | V,
): T | ValueNodeDefinition<V> {
  if (isNodeDefinition(node)) return node;
  if (isProxiedNode(node)) return getProxiedNodeDefinition(node);
  return value(node);
}
