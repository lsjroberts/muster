// tslint:disable-next-line:import-name-case-insensitive
import lodashStartCase from 'lodash/startCase';
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
 * An instance of the [[startCase]] node.
 * See the [[startCase]] documentation to find out more.
 */
export interface StartCaseNode extends StatelessGraphNode<'start-case', StartCaseNodeProperties> {}

/**
 * A definition of the [[startCase]] node.
 * See the [[startCase]] documentation to find out more.
 */
export interface StartCaseNodeDefinition
  extends StatelessNodeDefinition<'start-case', StartCaseNodeProperties> {}

export interface StartCaseNodeProperties {
  subject: NodeDefinition;
}

/**
 * The implementation of the [[startCase]] node.
 * See the [[startCase]] documentation to learn more.
 */
export const StartCaseNodeType: StatelessNodeType<
  'start-case',
  StartCaseNodeProperties
> = createNodeType<'start-case', StartCaseNodeProperties>('start-case', {
  shape: {
    subject: graphTypes.nodeDefinition,
  },
  operations: {
    evaluate: {
      getDependencies({ subject }: StartCaseNodeProperties): Array<NodeDependency> {
        return [
          {
            target: subject,
            acceptNil: true,
            until: untilStringValueNode(StartCaseNodeType, 'subject'),
          },
        ];
      },
      run(node: StartCaseNode, options: never, [subject]: [ValueNode<string>]): NodeDefinition {
        if (NilNodeType.is(subject)) return nil();
        return value(lodashStartCase(subject.definition.properties.value));
      },
    },
  },
});

/**
 * Creates a new instance of a [[startCased]] node, which is used when converting a string to a start case string. The node expects
 * the subject to be a [[value]] that contains a string value. It works in a similar way to the
 * `startCase` method from `lodash`: https://lodash.com/docs/4.17.4#startCase
 *
 *
 * @example **Convert string to start case**
 * ```js
 * import muster, { startCase } from '@dws/muster';
 *
 * const app = muster({});
 *
 * await app.resolve(startCase('Hello World'));
 * // === 'Hello World'
 *
 * await app.resolve(startCase('hello world'));
 * // === 'Hello World'
 *
 * await app.resolve(startCase('HELLO world'));
 * // === 'HELLO World'
 * ```
 */
export function startCase(subject: NodeLike): StartCaseNodeDefinition {
  return createNodeDefinition(StartCaseNodeType, {
    subject: toValue(subject),
  });
}

export function isStartCaseNodeDefinition(value: NodeDefinition): value is StartCaseNodeDefinition {
  return value.type === StartCaseNodeType;
}
