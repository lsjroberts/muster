import {
  resetOperation,
  ResettableGraphNode,
  supportsResetOperation,
} from '../../operations/reset';
import {
  GraphAction,
  GraphNode,
  isNodeDefinition,
  NodeDefinition,
  NodeDependency,
  NodeLike,
  StatelessGraphNode,
  StatelessNodeDefinition,
  StatelessNodeType,
} from '../../types/graph';
import createGraphAction from '../../utils/create-graph-action';
import createNodeDefinition from '../../utils/create-node-definition';
import { createNodeType } from '../../utils/create-node-type';
import { getInvalidTypeErrorMessage } from '../../utils/get-invalid-type-error';
import * as graphTypes from '../../utils/graph-types';
import pascalCase from '../../utils/pascal-case';
import { ref, RootAndPath } from '../../utils/ref';

/**
 * An instance of the [[reset]] node.
 * See the [[reset]] documentation to find out more.
 */
export interface ResetNode extends StatelessGraphNode<'reset', ResetNodeProperties> {}

/**
 * A definition of the [[reset]] node.
 * See the [[reset]] documentation to find out more.
 */
export interface ResetNodeDefinition
  extends StatelessNodeDefinition<'reset', ResetNodeProperties> {}

export interface ResetNodeProperties {
  target: NodeDefinition;
}

/**
 * The implementation of the [[reset]] node.
 * See the [[reset]] documentation to learn more.
 */
export const ResetNodeType: StatelessNodeType<'reset', ResetNodeProperties> = createNodeType<
  'reset',
  ResetNodeProperties
>('reset', {
  shape: {
    target: graphTypes.nodeDefinition,
  },
  operations: {
    evaluate: {
      cacheable: false,
      getDependencies({ target }: ResetNodeProperties): [NodeDependency] {
        return [
          {
            target,
            until: {
              predicate: supportsResetOperation,
              errorMessage(node: GraphNode): string {
                return getInvalidTypeErrorMessage(
                  `${pascalCase(ResetNodeType.name)} target cannot be reset`,
                  { received: node.definition },
                );
              },
            },
          },
        ];
      },
      run(node: ResetNode, operation: never, [subjectNode]: [ResettableGraphNode]): GraphAction {
        return createGraphAction(subjectNode, resetOperation());
      },
    },
  },
});

export function reset(rootAndPath: RootAndPath): ResetNodeDefinition;
export function reset(target: NodeDefinition): ResetNodeDefinition;
export function reset(path: NodeLike | Array<NodeLike>): ResetNodeDefinition;
export function reset(...path: Array<NodeLike>): ResetNodeDefinition;

/**
 * Creates a new instance of a [[reset]] node, which is used when resetting the stored value of a [[variable]].
 * It is responsible for calling a `reset` method from given node's implementation object
 * ([[NodeType]]).
 *
 * @example **Reset a variable**
 * ```ts
 * import muster, { ref, reset, set, variable } from '@dws/muster';
 *
 * const app = muster({
 *   name: variable('Bob'),
 * });
 *
 * app.resolve(ref('name')).subscribe((name) => {
 *   console.log(name);
 * });
 *
 * console.log('Changing name to Jane');
 * await app.resolve(set('name', 'Jane'));
 *
 * console.log('Resetting name');
 * await app.resolve(reset('name'));
 *
 * // Console output:
 * // Bob
 * // Changing name to Jane
 * // Jane
 * // Resetting name
 * // Bob
 * ```
 * This example demonstrates the use of a [[reset]] to reset a value of a [[variable]]
 * back to the initial value. See the [[variable]] documentation for more information on
 * how [[variable]] works.
 */
export function reset(
  ...args: Array<RootAndPath | NodeDefinition | NodeLike | Array<NodeLike>>
): ResetNodeDefinition {
  return createNodeDefinition(ResetNodeType, {
    target: args.length === 1 && isNodeDefinition(args[0]) ? args[0] : ref(...args),
  });
}

export function isResetNodeDefinition(value: NodeDefinition): value is ResetNodeDefinition {
  return value.type === ResetNodeType;
}
