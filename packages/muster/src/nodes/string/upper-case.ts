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
import { toValue, value, ValueNode } from '../graph/value';

/**
 * An instance of the [[upperCase]] node.
 * See the [[upperCase]] documentation to find out more.
 */
export interface UpperCaseNode extends StatelessGraphNode<'upper-case', UpperCaseNodeProperties> {}

/**
 * A definition of the [[upperCase]] node.
 * See the [[upperCase]] documentation to find out more.
 */
export interface UpperCaseNodeDefinition
  extends StatelessNodeDefinition<'upper-case', UpperCaseNodeProperties> {}

export interface UpperCaseNodeProperties {
  subject: NodeDefinition;
}

/**
 * The implementation of the [[upperCase]] node.
 * See the [[upperCase]] documentation to learn more.
 */
export const UpperCaseNodeType: StatelessNodeType<
  'upper-case',
  UpperCaseNodeProperties
> = createNodeType<'upper-case', UpperCaseNodeProperties>('upper-case', {
  shape: {
    subject: graphTypes.nodeDefinition,
  },
  operations: {
    evaluate: {
      getDependencies({ subject }: UpperCaseNodeProperties): Array<NodeDependency> {
        return [
          {
            target: subject,
            until: untilStringValueNode(UpperCaseNodeType, 'subject'),
          },
        ];
      },
      run(node: UpperCaseNode, options: never, [subject]: [ValueNode<string>]): NodeDefinition {
        return value(subject.definition.properties.value.toUpperCase());
      },
    },
  },
});

/**
 * Creates a new instance of a [[upperCase]] node, which is used when converting a string to an upper case string. The node expects
 * the subject to be a [[value]] that contains a string value. It works in a similar way to the
 * `String.toUpperCase` method in JavaScript.
 *
 *
 * @example **Convert string to upper case**
 * ```js
 * import muster, { upperCase } from '@dws/muster';
 *
 * const app = muster({});
 *
 * await app.resolve(upperCase('Hello World'));
 * // === 'HELLO WORLD'
 * ```
 */
export function upperCase(subject: NodeLike): UpperCaseNodeDefinition {
  return createNodeDefinition(UpperCaseNodeType, {
    subject: toValue(subject),
  });
}

export function isUpperCaseNodeDefinition(value: NodeDefinition): value is UpperCaseNodeDefinition {
  return value.type === UpperCaseNodeType;
}
