// tslint:disable-next-line:import-name-case-insensitive
import lodashToString from 'lodash/toString';
import {
  NodeDefinition,
  NodeDependency,
  NodeLike,
  StatelessGraphNode,
  StatelessNodeDefinition,
  StatelessNodeType,
} from '../../types/graph';
import createNodeDefinition from '../../utils/create-node-definition';
import { createNodeType } from '../../utils/create-node-type';
import * as graphTypes from '../../utils/graph-types';
import { untilValueNode } from '../../utils/is-value-node';
import { nil, NilNodeType } from '../graph/nil';
import { toValue, value, ValueNode } from '../graph/value';

/**
 * An instance of the [[toString]] node.
 * See the [[toString]] documentation to find out more.
 */
export interface ToStringNode extends StatelessGraphNode<'to-string', ToStringNodeProperties> {}

/**
 * A definition of the [[toString]] node.
 * See the [[toString]] documentation to find out more.
 */
export interface ToStringNodeDefinition
  extends StatelessNodeDefinition<'to-string', ToStringNodeProperties> {}

export interface ToStringNodeProperties {
  subject: NodeDefinition;
}

/**
 * The implementation of the [[toString]] node.
 * See the [[toString]] documentation to learn more.
 */
export const ToStringNodeType: StatelessNodeType<
  'to-string',
  ToStringNodeProperties
> = createNodeType<'to-string', ToStringNodeProperties>('to-string', {
  shape: {
    subject: graphTypes.nodeDefinition,
  },
  operations: {
    evaluate: {
      getDependencies({ subject }: ToStringNodeProperties): Array<NodeDependency> {
        return [
          {
            target: subject,
            acceptNil: true,
            until: untilValueNode(ToStringNodeType, 'subject'),
          },
        ];
      },
      run(node: ToStringNode, options: never, [subject]: [ValueNode<any>]): NodeDefinition {
        if (NilNodeType.is(subject)) return nil();
        return value(lodashToString(subject.definition.properties.value));
      },
    },
  },
});

/**
 * Creates a new instance of a [[toString]] node, which is used when converting a any type value to a stringified version of the
 * value. It uses the `toString` helper from lodash to do the conversion. The node expects the
 * subject to be a [[value]] containing a string value.
 *
 *
 * @example **Convert to string**
 * ```js
 * import muster, { toString } from '@dws/muster';
 *
 * const app = muster({});
 *
 * await app.resolve(toString('Hello world'));
 * // === 'Hello world'
 *
 * await app.resolve(toString(123));
 * // === '123'
 *
 * await app.resolve(toString(true));
 * // === 'true'
 *
 * await app.resolve(toString({ hello: 'world'}));
 * // === '[object Object]'
 * ```
 */
export function toString(subject: NodeLike): ToStringNodeDefinition {
  return createNodeDefinition(ToStringNodeType, {
    subject: toValue(subject),
  });
}

export function isToStringNodeDefinition(value: NodeDefinition): value is ToStringNodeDefinition {
  return value.type === ToStringNodeType;
}
