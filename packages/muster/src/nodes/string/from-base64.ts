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
 * An instance of the [[fromBase64]] node.
 * See the [[fromBase64]] documentation to find out more.
 */
export interface FromBase64Node
  extends StatelessGraphNode<'from-base64', FromBase64NodeProperties> {}

/**
 * A definition of the [[fromBase64]] node.
 * See the [[fromBase64]] documentation to find out more.
 */
export interface FromBase64NodeDefinition
  extends StatelessNodeDefinition<'from-base64', FromBase64NodeProperties> {}

export interface FromBase64NodeProperties {
  subject: NodeDefinition;
}

/**
 * The implementation of the [[fromBase64]] node.
 * See the [[fromBase64]] documentation to learn more.
 */
export const FromBase64NodeType: StatelessNodeType<
  'from-base64',
  FromBase64NodeProperties
> = createNodeType<'from-base64', FromBase64NodeProperties>('from-base64', {
  shape: {
    subject: graphTypes.nodeDefinition,
  },
  operations: {
    evaluate: {
      getDependencies({ subject }: FromBase64NodeProperties): Array<NodeDependency> {
        return [
          {
            target: subject,
            acceptNil: true,
            until: untilStringValueNode(FromBase64NodeType, 'subject'),
          },
        ];
      },
      run(node: FromBase64Node, options: never, [subject]: [ValueNode<string>]): NodeDefinition {
        if (NilNodeType.is(subject)) return nil();
        return value(atob(subject.definition.properties.value));
      },
    },
  },
});

/**
 * Creates a new instance of a [[fromBase64]] node, which is used when converting a base64 encoded string back to a normal string.
 * The node expects the subject to be a [[value]] that contains a string value.
 *
 *
 * @example **Convert the string back from Base64**
 * ```js
 * import muster, { fromBase64 } from '@dws/muster';
 *
 * const app = muster({});
 *
 * await app.resolve(fromBase64('SGVsbG8gd29ybGQ='));
 * // === 'Hello world'
 * ```
 * This example shows how to convert a base 64 encoded string to a string.
 */
export function fromBase64(subject: NodeLike): FromBase64NodeDefinition {
  return createNodeDefinition(FromBase64NodeType, {
    subject: toValue(subject),
  });
}

export function isFromBase64NodeDefinition(
  value: NodeDefinition,
): value is FromBase64NodeDefinition {
  return value.type === FromBase64NodeType;
}
