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
import { untilStringValueNode } from '../../utils/is-string-value-node';
import { nil, NilNodeType } from '../graph/nil';
import { toValue, value, ValueNode } from '../graph/value';

/**
 * An instance of the [[toBase64]] node.
 * See the [[toBase64]] documentation to find out more.
 */
export interface ToBase64Node extends StatelessGraphNode<'to-base64', ToBase64NodeProperties> {}

/**
 * A definition of the [[toBase64]] node.
 * See the [[toBase64]] documentation to find out more.
 */
export interface ToBase64NodeDefinition
  extends StatelessNodeDefinition<'to-base64', ToBase64NodeProperties> {}

export interface ToBase64NodeProperties {
  subject: NodeDefinition;
}

/**
 * The implementation of the [[toBase64]] node.
 * See the [[toBase64]] documentation to learn more.
 */
export const ToBase64NodeType: StatelessNodeType<
  'to-base64',
  ToBase64NodeProperties
> = createNodeType<'to-base64', ToBase64NodeProperties>('to-base64', {
  shape: {
    subject: graphTypes.nodeDefinition,
  },
  operations: {
    evaluate: {
      getDependencies({ subject }: ToBase64NodeProperties): Array<NodeDependency> {
        return [
          {
            target: subject,
            acceptNil: true,
            until: untilStringValueNode(ToBase64NodeType, 'subject'),
          },
        ];
      },
      run(node: ToBase64Node, options: never, [subject]: [ValueNode<string>]): NodeDefinition {
        if (NilNodeType.is(subject)) return nil();
        return value(btoa(subject.definition.properties.value));
      },
    },
  },
});

/**
 * Creates a new instance of a [[toBase64]] node, which is used when converting a string to a base64 encoded string
 * The node expects the subject to be a [[value]] that contains a string value.
 *
 *
 * @example **Convert the string to Base64**
 * ```js
 * import muster, { toBase64 } from '@dws/muster';
 *
 * const app = muster({});
 *
 * await app.resolve(toBase64('Hello world'));
 * // === 'SGVsbG8gd29ybGQ='
 * ```
 * This example shows how to convert a string to a base64 string.
 */
export function toBase64(subject: NodeLike): ToBase64NodeDefinition {
  return createNodeDefinition(ToBase64NodeType, {
    subject: toValue(subject),
  });
}

export function isToBase64NodeDefinition(value: NodeDefinition): value is ToBase64NodeDefinition {
  return value.type === ToBase64NodeType;
}
