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
import * as graphTypes from '../../utils/graph-types';
import { toNode } from '../../utils/to-node';

/**
 * An instance of the [[otherwise]] node.
 * See the [[otherwise]] documentation to find out more.
 */
export interface OtherwiseNode extends StaticGraphNode<'otherwise', OtherwiseNodeProperties> {}

/**
 * A definition of the [[otherwise]] node.
 * See the [[otherwise]] documentation to find out more.
 */
export interface OtherwiseNodeDefinition
  extends StaticNodeDefinition<'otherwise', OtherwiseNodeProperties> {}

export interface OtherwiseNodeProperties {
  value: NodeDefinition;
}

/**
 * The implementation of the [[otherwise]] node.
 * See the [[otherwise]] documentation to learn more.
 */
export const OtherwiseNodeType: StaticNodeType<
  'otherwise',
  OtherwiseNodeProperties
> = createNodeType<'otherwise', OtherwiseNodeProperties>('otherwise', {
  shape: {
    value: graphTypes.nodeDefinition,
  },
});

/**
 * Creates a new instance of a [[otherwise]] node, which is used when defining a [[switchOn]] and [[choose]] nodes.
 * See the [[switchOn]] and [[choose]] documentation for examples of use.
 */
export function otherwise(value: NodeDefinition | NodeLike): OtherwiseNodeDefinition {
  return createNodeDefinition(OtherwiseNodeType, {
    value: isNodeDefinition(value) ? value : toNode(value),
  });
}

export function isOtherwiseNodeDefinition(value: NodeDefinition): value is OtherwiseNodeDefinition {
  return value.type === OtherwiseNodeType;
}
