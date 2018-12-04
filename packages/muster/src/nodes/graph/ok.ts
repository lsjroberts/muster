import {
  NodeDefinition,
  StaticGraphNode,
  StaticNodeDefinition,
  StaticNodeType,
} from '../../types/graph';
import createNodeDefinition from '../../utils/create-node-definition';
import { createNodeType } from '../../utils/create-node-type';

/**
 * An instance of the [[ok]] node.
 * See the [[ok]] documentation to find out more.
 */
export interface OkNode extends StaticGraphNode<'ok'> {}

/**
 * A definition of the [[ok]] node.
 * See the [[ok]] documentation to find out more.
 */
export interface OkNodeDefinition extends StaticNodeDefinition<'ok'> {}

/**
 * The implementation of the [[ok]] node.
 * See the [[ok]] documentation to learn more.
 */
export const OkNodeType: StaticNodeType<'ok'> = createNodeType<'ok'>('ok');

const INSTANCE = createNodeDefinition(OkNodeType, {});

/**
 * Creates a new instance of a [[ok]] node, which is a type of a [[NodeDefinition]] used for notifying subscribers,
 * that a given operation was performed successfully.
 */
export function ok(): OkNodeDefinition {
  return INSTANCE;
}

export function isOkNodeDefinition(value: NodeDefinition): value is OkNodeDefinition {
  return value.type === OkNodeType;
}
