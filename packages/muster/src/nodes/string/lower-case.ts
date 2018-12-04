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
 * An instance of the [[lowerCase]] node.
 * See the [[lowerCase]] documentation to find out more.
 */
export interface LowerCaseNode extends StatelessGraphNode<'lower-case', LowerCaseNodeProperties> {}

/**
 * A definition of the [[lowerCase]] node.
 * See the [[lowerCase]] documentation to find out more.
 */
export interface LowerCaseNodeDefinition
  extends StatelessNodeDefinition<'lower-case', LowerCaseNodeProperties> {}

export interface LowerCaseNodeProperties {
  subject: NodeDefinition;
}

/**
 * The implementation of the [[lowerCase]] node.
 * See the [[lowerCase]] documentation to learn more.
 */
export const LowerCaseNodeType: StatelessNodeType<
  'lower-case',
  LowerCaseNodeProperties
> = createNodeType<'lower-case', LowerCaseNodeProperties>('lower-case', {
  shape: {
    subject: graphTypes.nodeDefinition,
  },
  operations: {
    evaluate: {
      getDependencies({ subject }: LowerCaseNodeProperties): Array<NodeDependency> {
        return [
          {
            target: subject,
            until: untilStringValueNode(LowerCaseNodeType, 'subject'),
          },
        ];
      },
      run(node: LowerCaseNode, options: never, [subject]: [ValueNode<string>]): NodeDefinition {
        return value(subject.definition.properties.value.toLowerCase());
      },
    },
  },
});

/**
 * Creates a new instance of a [[lowerCase]] node, which is used when converting a string to a lower case string. The node expects
 * the subject to be a [[value]] that contains a string value. It works in a similar way to the
 * `String.toLowerCase` method in JavaScript.
 *
 *
 * @example **Convert string to lower case**
 * ```js
 * import muster, { lowerCase } from '@dws/muster';
 *
 * const app = muster({});
 *
 * await app.resolve(lowerCase('Hello World'));
 * // === 'hello world'
 * ```
 */
export function lowerCase(subject: NodeLike): LowerCaseNodeDefinition {
  return createNodeDefinition(LowerCaseNodeType, {
    subject: toValue(subject),
  });
}

export function isLowerCaseNodeDefinition(value: NodeDefinition): value is LowerCaseNodeDefinition {
  return value.type === LowerCaseNodeType;
}
