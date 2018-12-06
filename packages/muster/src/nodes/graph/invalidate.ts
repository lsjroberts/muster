import { evaluateOperation, supportsEvaluateOperation } from '../../operations/evaluate';
import { resolveOperation } from '../../operations/resolve';
import {
  GraphNode,
  isNodeDefinition,
  NodeDefinition,
  NodeExecutionContext,
  NodeLike,
  StatefulGraphNode,
  StatefulNodeDefinition,
  StatefulNodeType,
} from '../../types/graph';
import createGraphAction from '../../utils/create-graph-action';
import createNodeDefinition from '../../utils/create-node-definition';
import { createNodeType } from '../../utils/create-node-type';
import * as graphTypes from '../../utils/graph-types';
import { isDynamicNode } from '../../utils/is-dynamic-node';
import { ref, RootAndPath } from '../../utils/ref';
import withScopeFrom from '../../utils/with-scope-from';
import { ok } from './ok';
import { resolve } from './resolve';

/**
 * An instance of the [[invalidate]] node.
 * See the [[invalidate]] documentation to find out more.
 */
export interface InvalidateNode extends StatefulGraphNode<'invalidate', InvalidateNodeProperties> {}

/**
 * A definition of the [[invalidate]] node.
 * See the [[invalidate]] documentation to find out more.
 */
export interface InvalidateNodeDefinition
  extends StatefulNodeDefinition<'invalidate', InvalidateNodeProperties> {}

export interface InvalidateNodeProperties {
  target: NodeDefinition;
}

export interface InvalidateNodeState {}

export interface InvalidateNodeData {}

/**
 * The implementation of the [[invalidate]].
 * See the [[invalidate]] documentation to learn more.
 */
export const InvalidateNodeType: StatefulNodeType<
  'invalidate',
  InvalidateNodeProperties
> = createNodeType<'invalidate', InvalidateNodeProperties>('invalidate', {
  state: {},
  shape: {
    target: graphTypes.nodeDefinition,
  },
  getInitialState(): InvalidateNodeState {
    return {};
  },
  operations: {
    evaluate: {
      cacheable: false,
      run(): GraphNode | NodeDefinition {
        return ok();
      },
      onSubscribe(
        this: NodeExecutionContext<InvalidateNodeState, InvalidateNodeData>,
        node: InvalidateNode,
      ): void {
        if (!isDynamicNode(node)) {
          return;
        }
        const { target } = node.definition.properties;
        // Invalidate the target node via the store if it is already subscribed
        const wasSubscribed = node.scope.store.invalidate(withScopeFrom(node, target));
        if (wasSubscribed) {
          return;
        }
        if (!supportsEvaluateOperation(target)) {
          return;
        }
        // The target node is not currently subscribed, so create a temporary subscription to the
        // target just in order to figure out the next result in the chain, and invalidate that
        let isSync = true;
        let isCompleted = false;
        const unsubscribe = node.scope.store.subscribe(
          withScopeFrom(
            node,
            resolve(
              [createGraphAction(withScopeFrom(node, target), evaluateOperation())],
              ([nextTarget]) => withScopeFrom(nextTarget, invalidate(nextTarget.definition)),
            ),
          ),
          resolveOperation(),
          () => {
            isCompleted = true;
            if (isSync) return;
            unsubscribe();
          },
        );
        isSync = false;
        if (isCompleted) {
          unsubscribe();
        }
      },
    },
  },
});

/**
 * Creates a new instance of an [[invalidate]] node, which is a type of [[NodeDefinition]] used to trigger the
 * invalidation mechanism. Invalidation causes the target node to lose its value and forces a re-fetch of it.
 * This is particularly useful for nodes like [[fromPromise]] or [[computed]] that can
 * change value depending on external factors - e.g. calling an API endpoint or some local variable in the code
 * (which is not recommended).
 *
 * The invalidation mechanism can also be triggered upon dispatching a Muster event with the help of the
 * [[invalidateOn]]. See the [[dispatch]] to learn more about Muster events.
 *
 *
 * @example **Invalidate a fromPromise node**
 * ```ts
 * import muster, { fromPromise, invalidate, ref } from '@dws/muster';
 *
 * const externalNumbers = [1, 2, 3];
 *
 * const app = muster({
 *   numbers: fromPromise(() => Promise.resolve(externalNumbers)),
 * });
 *
 * app.resolve(ref('numbers')).subscribe((numbers) => {
 *   console.log(numbers);
 * });
 *
 * console.log('Adding `4` to numbers`');
 * externalNumbers.push(4);
 *
 * console.log('Invalidating `numbers`');
 * await app.resolve(invalidate(ref('numbers')));
 *
 * // Console output:
 * // [1, 2, 3]
 * // Adding `4` to numbers`
 * // Invalidating `numbers`
 * // [1, 2, 3, 4]
 * ```
 * This example shows how to use the [[invalidate]] to force re-fetching of a new value of the
 * targeted node. This particular example stores the data in a local variable, but nothing
 * prevents forcing an API re-fetch. This can be done in exactly the same way as in the
 * example above.
 */
export function invalidate(rootAndPath: RootAndPath): InvalidateNodeDefinition;
export function invalidate(target: NodeDefinition): InvalidateNodeDefinition;
export function invalidate(
  root: NodeDefinition,
  path: NodeLike | Array<NodeLike>,
): InvalidateNodeDefinition;
export function invalidate(...path: Array<NodeLike>): InvalidateNodeDefinition;

export function invalidate(
  ...args: Array<RootAndPath | NodeDefinition | NodeLike | Array<NodeLike>>
): InvalidateNodeDefinition {
  return createNodeDefinition(InvalidateNodeType, {
    target: args.length === 1 && isNodeDefinition(args[0]) ? args[0] : ref(...args),
  });
}

export function isInvalidateNodeDefinition(
  value: NodeDefinition,
): value is InvalidateNodeDefinition {
  return value.type === InvalidateNodeType;
}
