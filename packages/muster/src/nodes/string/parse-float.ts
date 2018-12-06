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
 * An instance of the [[parseFloat]] node.
 * See the [[parseFloat]] documentation to find out more.
 */
export interface ParseFloatNode
  extends StatelessGraphNode<'parse-float', ParseFloatNodeProperties> {}

/**
 * A definition of the [[parseFloat]] node.
 * See the [[parseFloat]] documentation to find out more.
 */
export interface ParseFloatNodeDefinition
  extends StatelessNodeDefinition<'parse-float', ParseFloatNodeProperties> {}

export interface ParseFloatNodeProperties {
  subject: NodeDefinition;
}

/**
 * The implementation of the [[parseFloat]] node.
 * See the [[parseFloat]] documentation to learn more.
 */
export const ParseFloatNodeType: StatelessNodeType<
  'parse-float',
  ParseFloatNodeProperties
> = createNodeType<'parse-float', ParseFloatNodeProperties>('parse-float', {
  shape: {
    subject: graphTypes.nodeDefinition,
  },
  operations: {
    evaluate: {
      getDependencies({ subject }: ParseFloatNodeProperties): Array<NodeDependency> {
        return [
          {
            target: subject,
            acceptNil: true,
            until: untilStringValueNode(ParseFloatNodeType, 'subject'),
          },
        ];
      },
      run(
        node: ParseFloatNode,
        options: never,
        [subject]: [ValueNode<string>, ValueNode<number>],
      ): NodeDefinition {
        if (NilNodeType.is(subject)) return nil();
        const subjectValue = subject.definition.properties.value;
        return value(Number.parseFloat(subjectValue));
      },
    },
  },
});

/**
 * Creates a new instance of a [[parseFloat]] node, which is used to convert values of a [[value]] to a float.
 *
 *
 * @example **Convert string to a float**
 * ```js
 * import muster, { parseFloat, ref } from '@dws/muster';
 *
 * const app = muster({
 *   one: '1',
 *   two: 2,
 *   threeAndAHalf: '3.5'
 * });
 *
 * const one = await app.resolve(parseFloat(ref('one')));
 * // one === 1
 *
 * const two = await app.resolve(parseFloat(ref('two')));
 * // two === 2
 *
 * const three = await app.resolve(parseFloat(ref('threeAndAHalf')));
 * // three === 3.5
 * ```
 * This example shows how to use the [[parseFloat]] to convert a value of a [[value]]
 * to a float.
 */
export function parseFloat(subject: NodeLike): ParseFloatNodeDefinition {
  return createNodeDefinition(ParseFloatNodeType, {
    subject: toValue(subject),
  });
}

export function isParseFloatNodeDefinition(
  value: NodeDefinition,
): value is ParseFloatNodeDefinition {
  return value.type === ParseFloatNodeType;
}
