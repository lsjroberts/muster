import {
  NodeDefinition,
  NodeLike,
  StaticGraphNode,
  StaticNodeDefinition,
  StaticNodeType,
} from '../../types/graph';
import createNodeDefinition from '../../utils/create-node-definition';
import { createNodeType } from '../../utils/create-node-type';
import { getInvalidTypeError } from '../../utils/get-invalid-type-error';
import * as graphTypes from '../../utils/graph-types';
import * as types from '../../utils/types';
import { DeferNodeFallbackGenerator } from './defer';
import { nil } from './nil';
import { isQuerySetChild, QuerySetChild } from './query-set';
import { toValue } from './value';

export interface QuerySetDeferNode
  extends StaticGraphNode<'query-set-defer', QuerySetDeferNodeProperties> {}

export interface QuerySetDeferNodeDefinition
  extends StaticNodeDefinition<'query-set-defer', QuerySetDeferNodeProperties> {}

export interface QuerySetDeferNodeProperties {
  fallbackGenerator: DeferNodeFallbackGenerator;
  target: QuerySetChild;
}

export const QuerySetDeferNodeType: StaticNodeType<
  'query-set-defer',
  QuerySetDeferNodeProperties
> = createNodeType<'query-set-defer', QuerySetDeferNodeProperties>('query-set-defer', {
  deserialize: false,
  serialize: false,
  shape: {
    fallbackGenerator: types.saveHash(types.func),
    target: graphTypes.nodeDefinition,
  },
});

export function querySetDefer(target: QuerySetChild): QuerySetDeferNodeDefinition;
export function querySetDefer(
  fallback: DeferNodeFallbackGenerator | NodeDefinition | NodeLike,
  target: QuerySetChild,
): QuerySetDeferNodeDefinition;
export function querySetDefer(
  ...args: [QuerySetChild] | [DeferNodeFallbackGenerator | NodeDefinition | NodeLike, QuerySetChild]
): QuerySetDeferNodeDefinition {
  const target = args.length === 1 ? args[0] : args[1];
  const fallback = args.length === 2 ? args[0] : undefined;
  if (!isQuerySetChild(target)) {
    throw getInvalidTypeError('Invalid querySetDefer node target key', {
      expected: 'QuerySetChild',
      received: target,
    });
  }
  return createNodeDefinition(QuerySetDeferNodeType, {
    fallbackGenerator: sanitizeFallback(fallback),
    target,
  });
}

export function isQuerySetDeferNodeDefinition(
  value: NodeDefinition,
): value is QuerySetDeferNodeDefinition {
  return value.type === QuerySetDeferNodeType;
}

function defaultFallbackGenerator(previous: NodeDefinition): NodeDefinition {
  return previous || nil();
}

function sanitizeFallback(
  fallback: DeferNodeFallbackGenerator | NodeDefinition | NodeLike | undefined,
): DeferNodeFallbackGenerator {
  if (!fallback) return defaultFallbackGenerator;
  if (typeof fallback === 'function') return fallback;
  const fallbackValue = toValue(fallback);
  return () => fallbackValue;
}
