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
import { ErrorNodeDefinition } from './error';
import { ErrorFallbackGenerator } from './if-error';
import { nil } from './nil';
import { isQuerySetChild, QuerySetChild } from './query-set';
import { toValue } from './value';

export interface QuerySetCatchErrorNode
  extends StaticGraphNode<'query-set-catch-error', QuerySetCatchErrorNodeProperties> {}

export interface QuerySetCatchErrorNodeDefinition
  extends StaticNodeDefinition<'query-set-catch-error', QuerySetCatchErrorNodeProperties> {}

export interface QuerySetCatchErrorNodeProperties {
  fallbackGenerator: ErrorFallbackGenerator;
  target: QuerySetChild;
}

export const QuerySetCatchErrorNodeType: StaticNodeType<
  'query-set-catch-error',
  QuerySetCatchErrorNodeProperties
> = createNodeType<'query-set-catch-error', QuerySetCatchErrorNodeProperties>(
  'query-set-catch-error',
  {
    deserialize: false,
    serialize: false,
    shape: {
      fallbackGenerator: types.saveHash(types.func),
      target: graphTypes.nodeDefinition,
    },
  },
);

export function querySetCatchError(target: QuerySetChild): QuerySetCatchErrorNodeDefinition;
export function querySetCatchError(
  fallback: ErrorFallbackGenerator | NodeDefinition | NodeLike,
  target: QuerySetChild,
): QuerySetCatchErrorNodeDefinition;
export function querySetCatchError(
  ...args: [QuerySetChild] | [ErrorFallbackGenerator | NodeDefinition | NodeLike, QuerySetChild]
): QuerySetCatchErrorNodeDefinition {
  const target = args.length === 1 ? args[0] : args[1];
  const fallback = args.length === 2 ? args[0] : undefined;
  if (!isQuerySetChild(target)) {
    throw getInvalidTypeError('Invalid querySetCatchError node target key', {
      expected: 'QuerySetChild',
      received: target,
    });
  }
  return createNodeDefinition(QuerySetCatchErrorNodeType, {
    fallbackGenerator: sanitizeFallback(fallback),
    target,
  });
}

export function isQuerySetCatchErrorNodeDefinition(
  value: NodeDefinition,
): value is QuerySetCatchErrorNodeDefinition {
  return value.type === QuerySetCatchErrorNodeType;
}

function defaultFallbackGenerator(
  error: ErrorNodeDefinition,
  previous: NodeDefinition,
): NodeDefinition {
  return previous || nil();
}

function sanitizeFallback(
  fallback: ErrorFallbackGenerator | NodeDefinition | NodeLike | undefined,
): ErrorFallbackGenerator {
  if (!fallback) return defaultFallbackGenerator;
  if (typeof fallback === 'function') return fallback;
  const fallbackValue = toValue(fallback);
  return () => fallbackValue;
}
