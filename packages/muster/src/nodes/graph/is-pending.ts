import {
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
import { isKeyNodeDefinition, key, KeyNodeDefinition, KeyNodeType } from './key';

/**
 * An instance of the [[isPending]] node.
 * See the [[isPending]] documentation to find out more.
 */
export interface IsPendingNode extends StaticGraphNode<'isPending', IsPendingNodeProperties> {}

/**
 * A definition of the [[isPending]] node.
 * See the [[isPending]] documentation to find out more.
 */
export interface IsPendingNodeDefinition
  extends StaticNodeDefinition<'isPending', IsPendingNodeProperties> {}

export interface IsPendingNodeProperties {
  target: KeyNodeDefinition;
}

/**
 * The implementation of the [[isPending]] node.
 * See the [[isPending]] documentation page to learn more.
 */
export const IsPendingNodeType: StaticNodeType<
  'isPending',
  IsPendingNodeProperties
> = createNodeType<'isPending', IsPendingNodeProperties>('isPending', {
  shape: {
    target: graphTypes.nodeDefinition,
  },
});

/**
 * Creates a new instance of a [[isPending]] node, which is a type of a [[NodeDefinition]] used as part of
 * a [[query]] to check if a given target is loading at a given moment.
 * See the **Check if deferred part of the query is loading** example from the [[query]] documentation to learn more.
 */
export function isPending(target: KeyNodeDefinition | NodeLike): IsPendingNodeDefinition {
  if (isNodeDefinition(target) && !isKeyNodeDefinition(target)) {
    throw getInvalidTypeError('Invalid key supplied to the isPending node.', {
      expected: [KeyNodeType],
      received: target,
    });
  }
  return createNodeDefinition(IsPendingNodeType, {
    target: isKeyNodeDefinition(target) ? target : key(target),
  });
}

export function isIsPendingNodeDefinition(value: NodeDefinition): value is IsPendingNodeDefinition {
  return value.type === IsPendingNodeType;
}
