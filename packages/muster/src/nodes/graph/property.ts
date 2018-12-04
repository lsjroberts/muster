import {
  GraphNode,
  isNodeDefinition,
  NodeDefinition,
  NodeDependency,
  NodeLike,
  StatelessGraphNode,
  StatelessNodeDefinition,
  StatelessNodeType,
} from '../../types/graph';
import createNodeDefinition from '../../utils/create-node-definition';
import { createNodeType } from '../../utils/create-node-type';
import { getInvalidTypeErrorMessage } from '../../utils/get-invalid-type-error';
import * as graphTypes from '../../utils/graph-types';
import * as types from '../../utils/types';
import { value, ValueNode, ValueNodeType } from './value';

/**
 * An instance of the [[property]] node.
 * See the [[property]] documentation to find out more.
 */
export interface PropertyNode extends StatelessGraphNode<'property', PropertyNodeProperties> {}

/**
 * A definition of the [[property]] node.
 * See the [[property]] documentation to find out more.
 */
export interface PropertyNodeDefinition
  extends StatelessNodeDefinition<'property', PropertyNodeProperties> {}

export interface PropertyNodeProperties {
  subject: NodeDefinition;
  path: Array<string>;
}

/**
 * The implementation of the [[property]] node.
 * See the [[property]] documentation to learn more.
 */
export const PropertyNodeType: StatelessNodeType<
  'property',
  PropertyNodeProperties
> = createNodeType<'property', PropertyNodeProperties>('property', {
  shape: {
    subject: graphTypes.nodeDefinition,
    path: types.arrayOf(types.string),
  },
  operations: {
    evaluate: {
      getDependencies({ subject }: PropertyNodeProperties): Array<NodeDependency> {
        return [
          {
            target: subject,
            until: {
              predicate: ValueNodeType.is,
              errorMessage(node: GraphNode): string {
                return getInvalidTypeErrorMessage(
                  'Property node subject must resolve to a value() node',
                  {
                    expected: ValueNodeType,
                    received: node.definition,
                  },
                );
              },
            },
          },
        ];
      },
      run(
        node: PropertyNode,
        options: never,
        [subjectNode]: [ValueNode<any>],
      ): NodeDefinition | GraphNode {
        const { path } = node.definition.properties;
        const subject = subjectNode.definition.properties.value;
        return value(getPath(subject, path));
      },
    },
  },
});

/**
 * Creates a new instance of a [[property]] node, which is used when extracting a value of a property from a pure JS object.
 * It works in the same way as `get` from `lodash`.
 *
 *
 * @example **Extract property from an object**
 * ```js
 * import muster, { property, value } from '@dws/muster';
 *
 * const app = muster({});
 *
 * await app.resolve(
 *   property(
 *     value({ name: 'Bob', description: 'Some description' }),
 *     'name'
 *   ),
 * );
 * // === 'Bob'
 * ```
 * This example shows how to use the [[property]] to extract the value of a property from a pure JS object.
 *
 *
 * @example **Extract nested property from an object**
 * ```js
 * import muster, { property, value } from '@dws/muster';
 *
 * const app = muster({});
 *
 * await app.resolve(
 *   property(
 *     value({
 *       deeply: {
 *         nested: { name: 'Bob', description: 'Some description' },
 *       },
 *     }),
 *     ['deeply', 'nested', 'name']
 *   ),
 * );
 * // === 'Bob'
 * ```
 * This example shows how to use the [[property]] to extract the value of a deeply nested property from a pure JS object.
 *
 *
 * @example **Extract property from a node in the graph**
 * ```js
 * import muster, { property, ref, value } from '@dws/muster';
 *
 * const app = muster({
 *   user: value({
 *     name: 'Bob',
 *     description: 'Some description',
 *   }),
 * });
 *
 * await app.resolve(property(ref('user'), 'name'));
 * // === 'Bob'
 * ```
 * This example shows that the [[property]] can operate on any kind of node that resolves to a [[value]].
 */
export function property(
  subject: NodeDefinition | NodeLike,
  path: string | Array<string>,
): PropertyNodeDefinition {
  return createNodeDefinition(PropertyNodeType, {
    subject: isNodeDefinition(subject) ? subject : value(subject),
    path: Array.isArray(path) ? path : [path],
  });
}

export function isPropertyNodeDefinition(value: NodeDefinition): value is PropertyNodeDefinition {
  return value.type === PropertyNodeType;
}

function getPath(object: { [key: string]: any }, path: Array<string>): any {
  return path.reduce((acc, key) => (typeof acc === 'object' && acc ? acc[key] : undefined), object);
}
