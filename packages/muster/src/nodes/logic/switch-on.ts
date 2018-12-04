import { CallableGraphNode, supportsCallOperation } from '../../operations/call';
import {
  GraphNode,
  isNodeDefinition,
  NodeDefinition,
  NodeDependency,
  NodeLike,
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
import { apply } from '../graph/apply';
import { value, ValueNode, ValueNodeType } from '../graph/value';
import { choose } from './choose';
import { eq } from './eq';
import { isOtherwiseNodeDefinition, OtherwiseNodeDefinition } from './otherwise';
import { isWhenNodeDefinition, when, WhenNodeDefinition } from './when';

/**
 * An instance of the [[switchOn]] node.
 * See the [[switchOn]] documentation to find out more.
 */
export interface SwitchOnNode extends StatelessGraphNode<'switchOn', SwitchOnNodeProperties> {}

/**
 * A definition of the [[switchOn]] node.
 * See the [[switchOn]] documentation to find out more.
 */
export interface SwitchOnNodeDefinition
  extends StatelessNodeDefinition<'switchOn', SwitchOnNodeProperties> {}

export interface SwitchOnNodeProperties {
  input: NodeDefinition;
  options: Array<WhenNodeDefinition>;
  fallback: OtherwiseNodeDefinition;
}

/**
 * The implementation of the [[switchOn]] node.
 * See the [[switchOn]] documentation to learn more.
 */
export const SwitchOnNodeType: StatelessNodeType<
  'switchOn',
  SwitchOnNodeProperties
> = createNodeType<'switchOn', SwitchOnNodeProperties>('switchOn', {
  shape: {
    input: graphTypes.nodeDefinition,
    options: types.arrayOf(graphTypes.nodeDefinition),
    fallback: graphTypes.nodeDefinition,
  },
  operations: {
    evaluate: {
      getDependencies({ input, options }: SwitchOnNodeProperties): Array<NodeDependency> {
        return [
          {
            target: input,
            until: untilInputIsValueNode,
          },
          ...options.map((option) => ({
            target: option.properties.pattern,
            until: untilPatternIsValueNodeOrCallableNode,
          })),
        ];
      },
      run(
        node: SwitchOnNode,
        operation: never,
        dependencies: Array<ValueNode<any> | CallableGraphNode>,
      ): NodeDefinition {
        const { options, fallback } = node.definition.properties;
        const [input] = dependencies as [ValueNode<any>];
        const [, ...resolvedOptions] = dependencies;
        return choose([
          ...resolvedOptions.map((option, index) =>
            when(
              ValueNodeType.is(option)
                ? eq(input.definition, option.definition)
                : apply([input], option),
              options[index].properties.value,
            ),
          ),
          fallback,
        ]);
      },
    },
  },
});

const untilInputIsValueNode: NodeDependency['until'] = {
  predicate: ValueNodeType.is,
  errorMessage(node: GraphNode): string {
    return getInvalidTypeErrorMessage('SwitchOn node input must resolve to a value node', {
      expected: ValueNodeType,
      received: node.definition,
    });
  },
};

const untilPatternIsValueNodeOrCallableNode: NodeDependency['until'] = {
  predicate: isValueNodeOrCallableNode,
  errorMessage(node: GraphNode): string {
    return getInvalidTypeErrorMessage(
      'SwitchOn node case match pattern must resolve to a value node or a pattern matcher',
      {
        expected: [ValueNodeType, 'pattern()'],
        received: node.definition,
      },
    );
  },
};

function isValueNodeOrCallableNode(node: GraphNode): node is ValueNode<any> | CallableGraphNode {
  return ValueNodeType.is(node) || supportsCallOperation(node);
}

/**
 * Creates a new instance of a [[switchOn]] node, which is used to conditionally return a different value. It works in a similar
 * way to the [[ifElse]] node, but allows for a more concise definition when defining
 * more than one condition.
 *
 * The conditions are defined with the help of [[case]] and [[otherwise]]
 * nodes. Each [[switchOn]] can define any number of [[case]] cases,
 * and MUST define exactly one [[otherwise]] node.
 *
 * @example **Simple switchOn node**
 * ```js
 * import muster, { otherwise, ref, switchOn, variable, when } from '@dws/muster';
 *
 * const app = muster({
 *   productType: variable(1),
 *   productTypeName: switchOn(ref('productType'), [
 *     when(1, 'Vegetable'),
 *     when(2, 'Meat'),
 *     when(3, 'Frozen'),
 *     otherwise('Unknown'),
 *   ]),
 * });
 *
 * await app.resolve(ref('productTypeName')); // === 'Vegetable'
 * ```
 *
 *
 * @example **switchOn with dynamic values**
 * ```js
 * import muster, {
 *   computed,
 *   match,
 *   otherwise,
 *   param,
 *   ref,
 *   switchOn,
 *   types,
 *   variable,
 *   when,
 * } from '@dws/muster';
 *
 * const app = muster({
 *   productType: variable(1),
 *   productTypeName: switchOn(ref('productType'), [
 *     when(1, ref('currentLocale', 'productType.vegetable')),
 *     when(2, ref('currentLocale', 'productType.meat')),
 *     when(3, ref('currentLocale', 'productType.frozen')),
 *     otherwise(ref('currentLocale', 'productType.unknown')),
 *   ]),
 *   currentLocale: ref('locales', ref('currentLocaleName')),
 *   currentLocaleName: variable('en-GB'),
 *   locales: {
 *     [match(types.string, 'language')]: {
 *       [match(types.string, 'key')]: computed([param('language'), param('key')], (lang, key) => {
 *          // TODO: Extract correct value from some locale file
 *          return 'test';
 *       }),
 *     },
 *   },
 * });
 *
 * await app.resolve(ref('productTypeName')); // === 'test'
 * ```
 *
 *
 * @example **switchOn with dynamic cases**
 * ```js
 * import muster, { otherwise, ref, switchOn, variable, when } from '@dws/muster';
 *
 * const app = muster({
 *   productType: variable(1),
 *   productTypeName: switchOn(ref('productType'), [
 *     when(ref('productTypes', 'vegetable'), 'Vegetable'),
 *     when(ref('productTypes', 'meat'), 'Meat'),
 *     when(ref('productTypes', 'frozen'), 'Frozen'),
 *     otherwise('Unknown'),
 *   ]),
 *   productTypes: {
 *     vegetable: 1,
 *     meat: 2,
 *     frozen: 3,
 *   },
 * });
 *
 * await app.resolve(ref('productTypeName')); // === 'Vegetable'
 * ```
 *
 *
 * @example **switchOn with pattern matching**
 * ```js
 * import muster, {
 *   format,
 *   gte,
 *   otherwise,
 *   pattern,
 *   ref,
 *   switchOn,
 *   variable,
 *   when,
 * } from '@dws/muster';
 *
 * const app = muster({
 *   subscribersCount: variable(15),
 *   subscribers: switchOn(ref('subscribers'), [
 *     when(0, 'No subscribers'),
 *     when(pattern((_) => gte(_, 1000)), 'Thousands of subscribers'),
 *     when(pattern((_) => gte(_, 100)), 'Hundreds of subscribers'),
 *     when(pattern((_) => gte(_, 30)), 'Many subscribers'),
 *     otherwise(format('${count} subscribers', { count: ref('subscribers') })),
 *   ]),
 * });
 *
 * await app.resolve(ref('subscribers')); // === '15 subscribers'
 * ```
 */
export function switchOn(
  input: NodeDefinition | NodeLike,
  cases: Array<WhenNodeDefinition | OtherwiseNodeDefinition>,
): SwitchOnNodeDefinition {
  const whenNodes = cases.filter((value) => value && isWhenNodeDefinition(value)) as Array<
    WhenNodeDefinition
  >;
  const otherwiseNodes = cases.filter(
    (value) => value && isOtherwiseNodeDefinition(value),
  ) as Array<OtherwiseNodeDefinition>;
  if (whenNodes.length + otherwiseNodes.length !== cases.length) {
    throw getInvalidTypeError('Invalid switchOn() cases', {
      expected: 'Array<when() | otherwise()>',
      received: cases,
    });
  }
  if (otherwiseNodes.length < 1) {
    throw getInvalidTypeError('Missing otherwise() node in switchOn() node', {
      received: cases,
    });
  }
  if (otherwiseNodes.length > 1) {
    throw getInvalidTypeError('Multiple otherwise() nodes in switchOn() node', {
      received: cases,
    });
  }
  const fallback = otherwiseNodes[0];
  return createNodeDefinition(SwitchOnNodeType, {
    input: isNodeDefinition(input) ? input : value(input),
    options: whenNodes,
    fallback,
  });
}

export function isSwitchOnNodeDefinition(value: NodeDefinition): value is SwitchOnNodeDefinition {
  return value.type === SwitchOnNodeType;
}
