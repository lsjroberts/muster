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
import { isKeyNodeDefinition, key, KeyNodeDefinition, KeyNodeType } from './key';
import { nil } from './nil';
import { toValue } from './value';

export type DeferNodeFallbackGenerator = (
  previousValue: NodeDefinition | undefined,
) => NodeDefinition;

/**
 * An instance of the [[defer]] node.
 * See the [[defer]] documentation to find out more.
 */
export interface DeferNode extends StaticGraphNode<'defer', DeferNodeProperties> {}

/**
 * A definition of the [[defer]] node.
 * See the [[defer]] documentation to find out more.
 */
export interface DeferNodeDefinition extends StaticNodeDefinition<'defer', DeferNodeProperties> {}

export interface DeferNodeProperties {
  fallbackGenerator: DeferNodeFallbackGenerator;
  target: KeyNodeDefinition;
}

/**
 * The implementation of the [[defer]].
 * See the [[defer]] documentation to learn more.
 */
export const DeferNodeType: StaticNodeType<'defer', DeferNodeProperties> = createNodeType<
  'defer',
  DeferNodeProperties
>('defer', {
  deserialize: false,
  serialize: false,
  shape: {
    fallbackGenerator: types.saveHash(types.func),
    target: graphTypes.nodeDefinition,
  },
});

/**
 * Creates a new instance of a [[defer]] node, which is a type of a [[NodeDefinition]] used inside a [[query]]
 * to indicate that a given part of the query should not block the remainder of the query from resolving.
 *
 * See the **Defer part of a query** example from the [[query]] documentation page to learn more.
 */
export function defer(target: KeyNodeDefinition | ChildKey): DeferNodeDefinition;
export function defer(
  fallback: DeferNodeFallbackGenerator | NodeDefinition | NodeLike,
  target: KeyNodeDefinition | ChildKey,
): DeferNodeDefinition;
export function defer(
  ...args: Array<
    KeyNodeDefinition | ChildKey | DeferNodeFallbackGenerator | NodeDefinition | NodeLike
  >
): DeferNodeDefinition {
  const target = args.length === 1 ? args[0] : args[1];
  const fallback = args.length === 2 ? args[0] : undefined;
  if (isNodeDefinition(target) && !isKeyNodeDefinition(target)) {
    throw getInvalidTypeError('Invalid defer node target key', {
      expected: [KeyNodeType],
      received: target,
    });
  }
  return createNodeDefinition(DeferNodeType, {
    target: isKeyNodeDefinition(target) ? target : key(target),
    fallbackGenerator: sanitizeFallback(fallback),
  });
}

export function isDeferNodeDefinition(value: NodeDefinition): value is DeferNodeDefinition {
  return value.type === DeferNodeType;
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
