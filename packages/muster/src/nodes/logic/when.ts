import {
  NodeDefinition,
  NodeLike,
  StaticGraphNode,
  StaticNodeDefinition,
  StaticNodeType,
} from '../../types/graph';
import createNodeDefinition from '../../utils/create-node-definition';
import { createNodeType } from '../../utils/create-node-type';
import * as graphTypes from '../../utils/graph-types';
import { toNode } from '../../utils/to-node';
import { toValue } from '../graph/value';

/**
 * An instance of the [[when]] node.
 * See the [[when]] documentation to find out more.
 */
export interface WhenNode extends StaticGraphNode<'when', WhenNodeProperties> {}

/**
 * A definition of the [[when]] node.
 * See the [[when]] documentation to find out more.
 */
export interface WhenNodeDefinition extends StaticNodeDefinition<'when', WhenNodeProperties> {}

export interface WhenNodeProperties {
  pattern: NodeDefinition;
  value: NodeDefinition;
}

/**
 * The implementation of the [[when]] node.
 * See the [[when]] documentation to learn more.
 */
export const WhenNodeType: StaticNodeType<'when', WhenNodeProperties> = createNodeType<
  'when',
  WhenNodeProperties
>('when', {
  shape: {
    pattern: graphTypes.nodeDefinition,
    value: graphTypes.nodeDefinition,
  },
});

/**
 * Creates a new instance of a [[when]] node, which is used when defining a [[switchOn]] and
 * [[choose]] nodes. See the [[switchOn]] and [[choose]] documentation for examples of use.
 */
export function when(
  pattern: NodeDefinition | NodeLike,
  value: NodeDefinition | NodeLike,
): WhenNodeDefinition {
  return createNodeDefinition(WhenNodeType, {
    pattern: toValue(pattern),
    value: toNode(value),
  });
}

export function isWhenNodeDefinition(value: NodeDefinition): value is WhenNodeDefinition {
  return value.type === WhenNodeType;
}
