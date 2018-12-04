const isPlainObject = require('is-plain-object');
import fromPairs from 'lodash/fromPairs';
import toPairs from 'lodash/toPairs';
import { array } from '../nodes/collection/array';
import { action } from '../nodes/graph/action';
import { computed } from '../nodes/graph/computed';
import { nil } from '../nodes/graph/nil';
import { param } from '../nodes/graph/param';
import { match, MISSING_PARAM_NAME, tree } from '../nodes/graph/tree';
import { value } from '../nodes/graph/value';
import {
  ChildKey,
  getProxiedNodeDefinition,
  isNodeDefinition,
  isProxiedNode,
  NodeDefinition,
  NodeLike,
} from '../types/graph';
import { deprecated } from './deprecated';
import * as types from './types';

export type NodeTransformer = ((input: NodeLike) => NodeDefinition | undefined);

const graphDeprecationWarning = deprecated({
  old: 'graph',
  new: 'toNode',
});

const objectToTreeDeprecationWarning = deprecated({
  old: 'objectToTree',
  new: 'toNode',
});

/**
 * Converts the object into a Muster node.
 * @param definition
 * @param options
 * @deprecated
 */
export function graph(
  definition: NodeLike,
  options?:
    | NodeTransformer
    | {
        catchAll?: boolean | ((key: ChildKey) => NodeDefinition);
        transform?: NodeTransformer;
      },
): NodeDefinition {
  graphDeprecationWarning();
  return toNode(definition, options);
}

export function objectToTree(definition: NodeLike): NodeDefinition {
  objectToTreeDeprecationWarning();
  return toNode(definition);
}

export function toNode(
  definition: NodeLike,
  options?:
    | NodeTransformer
    | {
        catchAll?: boolean | ((key: ChildKey) => NodeDefinition);
        transform?: NodeTransformer;
      },
): NodeDefinition {
  if (isProxiedNode(definition)) {
    return getProxiedNodeDefinition(definition);
  }
  const transform = typeof options === 'function' ? options : options && options.transform;
  const catchAll =
    options && typeof options === 'object' && options.catchAll
      ? typeof options.catchAll === 'function'
        ? ((factory) => computed([param(MISSING_PARAM_NAME)], (key) => factory(key)))(
            options.catchAll,
          )
        : nil()
      : undefined;
  // If the value has a custom replacement, return that
  const transformedNode = transform && transform(definition);
  if (transformedNode) {
    return transformedNode;
  }
  // If the value is already a valid graph node, return it as-is
  if (isNodeDefinition(definition)) {
    return definition;
  }
  // If the value is a primitive, wrap it in a value node and return it
  const isPrimitive = typeof definition !== 'object' || definition === null;
  if (isPrimitive) {
    return value(definition);
  }
  // If the value is an array, turn it into a collection
  if (Array.isArray(definition)) {
    return array(definition.map((item) => toNode(item, options)));
  }
  // If the value is a function, wrap it in an action node and return it
  if (typeof definition === 'function') {
    return action(definition);
  }
  // If the value is a plain object (not an instance of some class)
  const treeIsPlainObject =
    isPlainObject(definition) || (typeof definition === 'object' && !definition.constructor);
  if (treeIsPlainObject) {
    // Recursively build up the branch out of the properties of this object
    return tree(
      fromPairs(
        [
          ...toPairs(definition),
          ...Object.getOwnPropertySymbols(definition).map(
            (key) => [key, definition[key]] as [symbol, any],
          ),
          ...(catchAll
            ? [[match(types.any, MISSING_PARAM_NAME), catchAll] as [string, NodeDefinition]]
            : []),
        ].map(([key, node]) => [key, toNode(node, options)]),
      ),
    );
  }
  // The value must be a class instance, wrap it in a value node
  return value(definition);
}
