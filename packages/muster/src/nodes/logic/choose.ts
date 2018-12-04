import {
  GraphNode,
  NodeDefinition,
  NodeDependency,
  StatelessGraphNode,
  StatelessNodeDefinition,
  StatelessNodeType,
} from '../../types/graph';
import createNodeDefinition from '../../utils/create-node-definition';
import { createNodeType } from '../../utils/create-node-type';
import {
  getInvalidTypeError,
  getInvalidTypeErrorMessage,
} from '../../utils/get-invalid-type-error';
import * as graphTypes from '../../utils/graph-types';
import * as types from '../../utils/types';
import { ValueNode, ValueNodeType } from '../graph/value';
import { isOtherwiseNodeDefinition, OtherwiseNodeDefinition } from './otherwise';
import { isWhenNodeDefinition, WhenNodeDefinition } from './when';

/**
 * An instance of the [[choose]] node.
 * See the [[choose]] documentation to find out more.
 */
export interface ChooseNode extends StatelessGraphNode<'choose', ChooseNodeProperties> {}

/**
 * A definition of the [[choose]] node.
 * See the [[choose]] documentation to find out more.
 */
export interface ChooseNodeDefinition
  extends StatelessNodeDefinition<'choose', ChooseNodeProperties> {}

export interface ChooseNodeProperties {
  options: Array<WhenNodeDefinition>;
  fallback: OtherwiseNodeDefinition;
}

/**
 * The implementation of the [[choose]] node.
 * See the [[choose]] documentation to learn more.
 */
export const ChooseNodeType: StatelessNodeType<'choose', ChooseNodeProperties> = createNodeType<
  'choose',
  ChooseNodeProperties
>('choose', {
  shape: {
    options: types.arrayOf(graphTypes.nodeDefinition),
    fallback: graphTypes.nodeDefinition,
  },
  operations: {
    evaluate: {
      getDependencies({ options }: ChooseNodeProperties): Array<NodeDependency> {
        return options.map((option) => ({
          target: option.properties.pattern,
          until: untilConditionIsValueNode,
        }));
      },
      run(node: ChooseNode, operation: never, conditions: Array<ValueNode<any>>): NodeDefinition {
        const { fallback, options } = node.definition.properties;
        const matchIndex = conditions.findIndex((condition) =>
          Boolean(condition.definition.properties.value),
        );
        if (matchIndex === -1) {
          return fallback.properties.value;
        }
        return options[matchIndex].properties.value;
      },
    },
  },
});

const untilConditionIsValueNode: NodeDependency['until'] = {
  predicate: ValueNodeType.is,
  errorMessage(node: GraphNode): string {
    return getInvalidTypeErrorMessage('Choose node condition must resolve to a value node', {
      expected: ValueNodeType,
      received: node.definition,
    });
  },
};

/**
 * Creates a new instance of a [[choose]] node, which is used to conditionally return a different value. It works in a similar
 * way to the [[ifElse]] node, but allows for a more concise definition when defining
 * more than one condition.
 *
 * The conditions are defined with the help of [[case]] and [[otherwise]] nodes.
 * Each [[switchOn]] can define any number of [[case]] cases, and MUST define exactly one [[otherwise]] node.
 *
 *
 * @example **Simple choose node**
 * ```js
 * import muster, {
 *   eq,
 *   choose,
 *   gt,
 *   otherwise,
 *   ref,
 *   variable,
 *   when,
 * } from '@dws/muster';
 *
 * const app = muster({
 *   input: variable(10),
 *   something: choose([
 *     when(eq(ref('input'), 10), 'It\'s ten!'),
 *     when(gt(ref('input'), 32), 'More than 32'),
 *     otherwise('Well, it\'s not ten and not more than 32'),
 *   ]),
 * });
 *
 * await app.resolve(ref('something')); // === It's ten!
 * ```
 */
export function choose(
  cases: Array<WhenNodeDefinition | OtherwiseNodeDefinition>,
): ChooseNodeDefinition {
  const whenNodes = cases.filter((value) => value && isWhenNodeDefinition(value)) as Array<
    WhenNodeDefinition
  >;
  const otherwiseNodes = cases.filter(
    (value) => value && isOtherwiseNodeDefinition(value),
  ) as Array<OtherwiseNodeDefinition>;
  if (whenNodes.length + otherwiseNodes.length !== cases.length) {
    throw getInvalidTypeError('Invalid choose() cases', {
      expected: 'Array<when() | otherwise()>',
      received: cases,
    });
  }
  if (otherwiseNodes.length < 1) {
    throw getInvalidTypeError('Missing otherwise() node in choose() node', {
      received: cases,
    });
  }
  if (otherwiseNodes.length > 1) {
    throw getInvalidTypeError('Multiple otherwise() nodes in choose() node', {
      received: cases,
    });
  }
  const fallback = otherwiseNodes[0];
  return createNodeDefinition(ChooseNodeType, {
    options: whenNodes,
    fallback,
  });
}

export function isChooseNodeDefinition(value: NodeDefinition): value is ChooseNodeDefinition {
  return value.type === ChooseNodeType;
}
