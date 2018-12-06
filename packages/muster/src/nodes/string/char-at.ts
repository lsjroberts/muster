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
import { untilPositiveIntegerValueNode } from '../../utils/is-positive-integer-value-node';
import { untilStringValueNode } from '../../utils/is-string-value-node';
import { nil, NilNodeType } from '../graph/nil';
import { toValue, value, ValueNode } from '../graph/value';

/**
 * An instance of the [[charAt]] node.
 * See the [[charAt]] documentation to find out more.
 */
export interface CharAtNode extends StatelessGraphNode<'char-at', CharAtNodeProperties> {}

/**
 * A definition of the [[charAt]] node.
 * See the [[charAt]] documentation to find out more.
 */
export interface CharAtNodeDefinition
  extends StatelessNodeDefinition<'char-at', CharAtNodeProperties> {}

export interface CharAtNodeProperties {
  index: NodeDefinition;
  subject: NodeDefinition;
}

/**
 * The implementation of the [[charAt]] node.
 * See the [[charAt]] documentation to learn more.
 */
export const CharAtNodeType: StatelessNodeType<'char-at', CharAtNodeProperties> = createNodeType<
  'char-at',
  CharAtNodeProperties
>('char-at', {
  shape: {
    index: graphTypes.nodeDefinition,
    subject: graphTypes.nodeDefinition,
  },
  operations: {
    evaluate: {
      getDependencies({ index, subject }: CharAtNodeProperties): Array<NodeDependency> {
        return [
          {
            target: index,
            until: untilPositiveIntegerValueNode(CharAtNodeType, 'index'),
          },
          {
            target: subject,
            acceptNil: true,
            until: untilStringValueNode(CharAtNodeType, 'subject'),
          },
        ];
      },
      run(
        node: CharAtNode,
        options: never,
        [index, subject]: [ValueNode<number>, ValueNode<string>],
      ): NodeDefinition {
        if (NilNodeType.is(subject)) return nil();
        const indexValue = index.definition.properties.value;
        const content = subject.definition.properties.value;
        if (indexValue >= content.length) return nil();
        return value(content.charAt(indexValue));
      },
    },
  },
});

/**
 * Creates a new instance of a [[charAt]] node, which is used when extracting a specific character from string. The node expects
 * the subject to be a [[value]] that contains a string value. It work in a similar way as
 * the `string.charAt(...)` function from JS.
 *
 *
 * @example **Extract char at**
 * ```js
 * import muster, { charAt } from '@dws/muster';
 *
 * const app = muster({});
 *
 * await app.resolve(charAt(1, 'Hello world'));
 * // === 'e'
 *
 * await app.resolve(charAt(20, 'Hello world'));
 * // === null
 * ```
 */
export function charAt(index: NodeLike, subject: NodeLike): CharAtNodeDefinition {
  return createNodeDefinition(CharAtNodeType, {
    index: toValue(index),
    subject: toValue(subject),
  });
}

export function isCharAtNodeDefinition(value: NodeDefinition): value is CharAtNodeDefinition {
  return value.type === CharAtNodeType;
}
