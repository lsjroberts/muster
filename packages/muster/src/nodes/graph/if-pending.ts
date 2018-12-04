import isEqual from 'lodash/isEqual';
import uniqueId from 'lodash/uniqueId';
import { FLUSH } from '../../events';
import {
  GraphNode,
  isNodeDefinition,
  NodeDefinition,
  NodeDependencyUntilCondition,
  NodeLike,
  StatelessGraphNode,
  StatelessNodeDefinition,
  StatelessNodeType,
} from '../../types/graph';
import createNodeDefinition from '../../utils/create-node-definition';
import { createNodeType } from '../../utils/create-node-type';
import { getInvalidTypeErrorMessage } from '../../utils/get-invalid-type-error';
import * as graphTypes from '../../utils/graph-types';
import * as types from '../../utils/types';
import withScopeFrom from '../../utils/with-scope-from';
import { ArrayNode, ArrayNodeType } from '../collection/array';
import { onGlobalEvent } from '../remote/schedulers';
import { buildQuerySetFromQueryBuilderSnapshot } from '../remote/utils/build-query-set-from-query-builder-snapshot';
import {
  getQueryBuilderSnapshot,
  QueriesSnapshot,
} from '../remote/utils/get-query-builder-snapshot';
import { QueryBuilder } from '../remote/utils/query-builder';
import { NilNodeType } from './nil';
import { ok } from './ok';
import { PendingNode, PendingNodeType } from './pending';
import { placeholder } from './placeholder';
import { querySet } from './query-set';
import {
  querySetResult,
  QuerySetResultNode,
  QuerySetResultNodeDefinition,
} from './query-set-result';
import { resolve } from './resolve';
import { takeLast } from './take-last';
import { toValue, value } from './value';

/**
 * An instance of the [[ifPending]] node.
 * See the [[ifPending]] documentation to find out more.
 */
export interface IfPendingNode extends StatelessGraphNode<'ifPending', IfPendingNodeProperties> {}

/**
 * A definition of the [[ifPending]] node.
 * See the [[ifPending]] documentation to find out more.
 */
export interface IfPendingNodeDefinition
  extends StatelessNodeDefinition<'ifPending', IfPendingNodeProperties> {}

export type PendingFallbackGenerator = (
  previousValue: NodeDefinition | undefined,
) => NodeDefinition;

export interface IfPendingNodeProperties {
  target: NodeDefinition;
  fallback: PendingFallbackGenerator | NodeDefinition | NodeLike;
}

/**
 * The implementation of the [[ifPending]].
 * See the [[ifPending]] documentation to learn more.
 */
export const IfPendingNodeType: StatelessNodeType<
  'ifPending',
  IfPendingNodeProperties
> = createNodeType<'ifPending', IfPendingNodeProperties>('ifPending', {
  shape: {
    target: graphTypes.nodeDefinition,
    fallback: types.oneOfType([
      types.saveHash(types.func),
      graphTypes.nodeDefinition,
      types.saveHash(types.any),
    ]),
  },
  operations: {
    evaluate: {
      run(node: IfPendingNode) {
        const { fallback, target } = node.definition.properties;
        const fallbackGenerator = parseFallbackGenerator(fallback);
        const queryBuilder = new QueryBuilder(uniqueId('if-pending_'));
        let resolveMirrorQuery: NodeDefinition = ok();
        let lastQuerySnapshot: QueriesSnapshot | undefined = undefined;
        let lastResolvedResult: QuerySetResultNodeDefinition | undefined = undefined;
        return takeLast([
          onGlobalEvent(FLUSH)(() => {
            if (!queryBuilder.isModified) return resolveMirrorQuery;
            queryBuilder.resetModifiedState();
            const queryBuilderSnapshot = getQueryBuilderSnapshot(queryBuilder);
            if (lastQuerySnapshot && isEqual(lastQuerySnapshot, queryBuilderSnapshot)) {
              return resolveMirrorQuery;
            }
            lastQuerySnapshot = queryBuilderSnapshot;
            const querySetWithCallback = buildQuerySetFromQueryBuilderSnapshot(
              queryBuilderSnapshot,
              queryBuilder,
            );
            const querySetChildren = querySetWithCallback.node.properties.children;
            const querySetWithTarget = querySet(target, querySetChildren);
            return (resolveMirrorQuery = resolve(
              [
                {
                  target: withScopeFrom(node, querySetWithTarget),
                  until: untilIsArrayNodeOrPendingNode,
                  acceptNil: true,
                  allowPending: true,
                },
              ],
              ([result]: [ArrayNode | PendingNode]) => {
                if (!PendingNodeType.is(result)) {
                  // Looks like the query is fully resolved - call the placeholder callbacks
                  lastResolvedResult = querySetResult(querySetChildren, result.definition);
                  querySetWithCallback.callback(result.definition);
                  return ok();
                }
                // Generate the fallback response and then resolve it to a simpler value
                return resolve(
                  [
                    {
                      target: fallbackGenerator(lastResolvedResult),
                      acceptNil: true,
                    },
                  ],
                  ([fallback]: [GraphNode]) => {
                    // Check if the fallback was resolved to a query set node
                    // This should simplify things a bit
                    if (
                      lastResolvedResult &&
                      fallback.definition.id === lastResolvedResult.properties.result.id
                    ) {
                      querySetWithCallback.callback(
                        (fallback as QuerySetResultNode).definition.properties.result,
                      );
                      return ok();
                    }
                    // Otherwise - run the querySet against the fallback to generate a correct result
                    return resolve(
                      [
                        {
                          target: withScopeFrom(
                            fallback,
                            querySet(fallback.definition, querySetChildren),
                          ),
                          acceptNil: true,
                          allowErrors: true,
                          allowPending: true,
                        },
                      ],
                      ([fallbackResult]: [GraphNode]) => {
                        querySetWithCallback.callback(fallbackResult.definition);
                        return ok();
                      },
                    );
                  },
                );
              },
            ));
          }),
          placeholder(queryBuilder, []),
        ]);
      },
    },
  },
});

const untilIsArrayNodeOrPendingNode: NodeDependencyUntilCondition = {
  predicate: isArrayNodeOrPendingNode,
  errorMessage(node: GraphNode): string {
    return getInvalidTypeErrorMessage('Invalid querySet result', {
      expected: [ArrayNodeType, PendingNodeType],
      received: node.definition,
    });
  },
};

function isArrayNodeOrPendingNode(node: GraphNode): node is ArrayNode | PendingNode {
  return ArrayNodeType.is(node) || PendingNodeType.is(node) || NilNodeType.is(node);
}

/**
 * Creates a new instance of a [[ifPending]] node, which is a type of a [[NodeDefinition]] used when there's a need
 * to always return a value for a certain node even if the `target` is not resolved (is pending).
 * This node is used by Muster-React to decide whether a certain query is loading. It works in a similar way to the
 * [[ifError]] with a difference that the [[ifError]] provides a fallback for the [[error]], while this
 * node provides a fallback for the [[pending]].
 *
 * The `fallback` can be either a pre-defined [[NodeDefinition]] or a fallback generator. The fallback
 * generator receives a previous value the `target` was resolved to (undefined if this is the
 * first time `target` is being resolved) and is expected to return a [[NodeLike]].
 *
 *
 * @example **Prevent `pending` state**
 * ```ts
 * import muster, { fromPromise, ifPending, ref, value } from '@dws/muster';
 *
 * const app = muster({
 *   asyncName: fromPromise(() => Promise.resolve('Bob')),
 *   syncName: ifPending(
 *     (previous) => previous || value('Loading...'),
 *     ref('asyncName'),
 *   ),
 * });
 *
 * app.resolve(ref('syncName')).subscribe((name) => {
 *   console.log(name);
 * });
 *
 * // Console output:
 * // Loading...
 * // Bob
 * ```
 * This example shows how to use the [[ifPending]] to synchronously return a name. It makes sure
 * that the `asyncName` node does not block the query.
 */
export function ifPending(
  fallback: PendingFallbackGenerator | NodeDefinition | NodeLike,
  target: NodeDefinition | NodeLike,
): IfPendingNodeDefinition {
  return createNodeDefinition(IfPendingNodeType, {
    fallback,
    target: isNodeDefinition(target) ? target : value(target),
  });
}

export function isIfPendingNodeDefinition(value: NodeDefinition): value is IfPendingNodeDefinition {
  return value.type === IfPendingNodeType;
}

function parseFallbackGenerator(
  factory: PendingFallbackGenerator | NodeDefinition | NodeLike,
): PendingFallbackGenerator {
  if (typeof factory === 'function') {
    return (previousValue: NodeDefinition | undefined) => toValue(factory(previousValue));
  }
  if (isNodeDefinition(factory)) {
    return () => factory;
  }
  const fallback = toValue(factory);
  return () => fallback;
}
