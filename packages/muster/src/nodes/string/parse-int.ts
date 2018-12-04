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
 * An instance of the [[parseInt]] node.
 * See the [[parseInt]] documentation to find out more.
 */
export interface ParseIntNode extends StatelessGraphNode<'parse-int', ParseIntNodeProperties> {}

/**
 * A definition of the [[parseInt]] node.
 * See the [[parseInt]] documentation to find out more.
 */
export interface ParseIntNodeDefinition
  extends StatelessNodeDefinition<'parse-int', ParseIntNodeProperties> {}

export interface ParseIntNodeProperties {
  radix: NodeDefinition;
  subject: NodeDefinition;
}

/**
 * The implementation of the [[parseInt]] node.
 * See the [[parseInt]] documentation to learn more.
 */
export const ParseIntNodeType: StatelessNodeType<
  'parse-int',
  ParseIntNodeProperties
> = createNodeType<'parse-int', ParseIntNodeProperties>('parse-int', {
  shape: {
    radix: graphTypes.nodeDefinition,
    subject: graphTypes.nodeDefinition,
  },
  operations: {
    evaluate: {
      getDependencies({ radix, subject }: ParseIntNodeProperties): Array<NodeDependency> {
        return [
          {
            target: subject,
            acceptNil: true,
            until: untilStringValueNode(ParseIntNodeType, 'subject'),
          },
          {
            target: radix,
            until: untilPositiveIntegerValueNode(ParseIntNodeType, 'radix'),
          },
        ];
      },
      run(
        node: ParseIntNode,
        options: never,
        [subject, radix]: [ValueNode<string>, ValueNode<number>],
      ): NodeDefinition {
        if (NilNodeType.is(subject)) return nil();
        const subjectValue = subject.definition.properties.value;
        const radixValue = radix.definition.properties.value;
        return value(Number.parseInt(subjectValue, radixValue));
      },
    },
  },
});

/**
 * Creates a new instance of a [[parseInt]] node, which is used to convert values of a [[value]] to an integer.
 *
 *
 * @example **Convert string to an integer**
 * ```js
 * import muster, { parseInt, ref } from '@dws/muster';
 *
 * const app = muster({
 *   one: '1',
 *   two: 2,
 * });
 *
 * const one = await app.resolve(parseInt(ref('one')));
 * // one === 1
 *
 * const two = await app.resolve(parseInt(ref('two')));
 * // two === 2
 *
 * const three = await app.resolve(parseInt('3'));
 * // three === 3
 * ```
 * This example shows how to use the [[parseInt]] to convert a value of a [[value]]
 * to an integer.
 */
export function parseInt(subject: NodeLike, radix?: NodeLike): ParseIntNodeDefinition {
  return createNodeDefinition(ParseIntNodeType, {
    radix: toValue(radix || 10),
    subject: toValue(subject),
  });
}

export function isParseIntNodeDefinition(value: NodeDefinition): value is ParseIntNodeDefinition {
  return value.type === ParseIntNodeType;
}
