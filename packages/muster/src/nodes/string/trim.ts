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
 * An instance of the [[trim]] node.
 * See the [[trim]] documentation to find out more.
 */
export interface TrimNode extends StatelessGraphNode<'trim', TrimNodeProperties> {}

/**
 * A definition of the [[trim]] node.
 * See the [[trim]] documentation to find out more.
 */
export interface TrimNodeDefinition extends StatelessNodeDefinition<'trim', TrimNodeProperties> {}

export interface TrimNodeProperties {
  subject: NodeDefinition;
}

/**
 * The implementation of the [[trim]] node.
 * See the [[trim]] documentation to learn more.
 */
export const TrimNodeType: StatelessNodeType<'trim', TrimNodeProperties> = createNodeType<
  'trim',
  TrimNodeProperties
>('trim', {
  shape: {
    subject: graphTypes.nodeDefinition,
  },
  operations: {
    evaluate: {
      getDependencies({ subject }: TrimNodeProperties): Array<NodeDependency> {
        return [
          {
            target: subject,
            acceptNil: true,
            until: untilStringValueNode(TrimNodeType, 'subject'),
          },
        ];
      },
      run(node: TrimNode, options: never, [subject]: [ValueNode<string>]): NodeDefinition {
        if (NilNodeType.is(subject)) return nil();
        const subjectValue = subject.definition.properties.value;
        return value((subjectValue || '').trim());
      },
    },
  },
});

/**
 * Creates a new instance of a [[trim]] node, which is used for trimming white-spaces from the string-based [[value]]s.
 * The node expects the subject to be a [[value]] containing a string value. It works in a
 * similar way to the `String.trim` method from JS.
 *
 *
 * @example **Trim a string**
 * ```js
 * import muster, { trim } from '@dws/muster';
 *
 * const app = muster({});
 *
 * await app.resolve(trim('  Hello world  '));
 * // === 'Hello world'
 *
 * await app.resolve(trim('Hello world'));
 * // === 'Hello world'
 * ```
 */
export function trim(subject: NodeLike): TrimNodeDefinition {
  return createNodeDefinition(TrimNodeType, {
    subject: toValue(subject),
  });
}

export function isTrimNodeDefinition(value: NodeDefinition): value is TrimNodeDefinition {
  return value.type === TrimNodeType;
}
