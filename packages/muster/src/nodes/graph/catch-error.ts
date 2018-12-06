import {
  ChildKey,
  isNodeDefinition,
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
import { isKeyNodeDefinition, key, KeyNodeDefinition, KeyNodeType } from './key';
import { nil } from './nil';
import { toValue } from './value';

/**
 * An instance of the [[catchError]] node.
 * See the [[catchError]] documentation to find out more.
 */
export interface CatchErrorNode extends StaticGraphNode<'catch-error', CatchErrorNodeProperties> {}

/**
 * A definition of the [[catchError]] node.
 * See the [[catchError]] documentation to find out more.
 */
export interface CatchErrorNodeDefinition
  extends StaticNodeDefinition<'catch-error', CatchErrorNodeProperties> {}

export interface CatchErrorNodeProperties {
  fallbackGenerator: ErrorFallbackGenerator;
  target: KeyNodeDefinition;
}

/**
 * The implementation of the [[catchError]].
 * See the [[catchError]] documentation to learn more.
 */
export const CatchErrorNodeType: StaticNodeType<
  'catch-error',
  CatchErrorNodeProperties
> = createNodeType<'catch-error', CatchErrorNodeProperties>('catch-error', {
  deserialize: false,
  serialize: false,
  shape: {
    fallbackGenerator: types.saveHash(types.func),
    target: graphTypes.nodeDefinition,
  },
});

/**
 * Creates a new instance of a [[catchError]] node, which is a type of a [[NodeDefinition]] used inside a [[query]]
 * to indicate that a given part of the query can resolve to an error, and in that case it should be replaced with
 * a given fallback value.
 *
 * @example **Fallback value when branch errors**
 * ```javascript
 * import muster, { catchError, error, key, query, root, value } from '@dws/muster';
 *
 * const app = muster({
 *   user: error('Some reason why user can`t be loaded'),
 * });
 *
 * await app.resolve(query(root(), {
 *   user: catchError(value('Could not load user'), {
 *     firstName: key('firstName'),
 *     lastName: key('lastName'),
 *   }),
 * })); // === 'Could not load user'
 * ```
 */
export function catchError(
  fallback: ErrorFallbackGenerator | NodeDefinition | NodeLike,
  target: KeyNodeDefinition | ChildKey,
): CatchErrorNodeDefinition {
  if (isNodeDefinition(target) && !isKeyNodeDefinition(target)) {
    throw getInvalidTypeError('Invalid catchError node target key', {
      expected: [KeyNodeType],
      received: target,
    });
  }
  return createNodeDefinition(CatchErrorNodeType, {
    target: isKeyNodeDefinition(target) ? target : key(target),
    fallbackGenerator: sanitizeFallback(fallback),
  });
}

export function isCatchErrorNodeDefinition(
  value: NodeDefinition,
): value is CatchErrorNodeDefinition {
  return value.type === CatchErrorNodeType;
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
