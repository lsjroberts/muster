import { GraphNode, NodeDefinition, StaticNodeType } from '../../types/graph';
import createNodeDefinition from '../../utils/create-node-definition';
import { createNodeType } from '../../utils/create-node-type';

/**
 * An instance of the [[pending]] node.
 * See the [[pending]] documentation to find out more.
 */
export interface PendingNode extends GraphNode<'pending', {}, never> {}

/**
 * A definition of the [[pending]] node.
 * See the [[pending]] documentation to find out more.
 */
export interface PendingNodeDefinition extends NodeDefinition<'pending', {}, never> {}

/**
 * The implementation of the [[pending]] node.
 * See the [[pending]] documentation to learn more.
 */
export const PendingNodeType: StaticNodeType<'pending'> = createNodeType<'pending'>('pending');

const INSTANCE = createNodeDefinition(PendingNodeType, {});

/**
 * Creates a new instance of a [[pending]] node, which informs Muster that a given node has not yet resolved its
 * value.
 *
 * The [[pending]] is rarely returned to any other node as it's swallowed by the node
 * resolver (see the [resolve](../modules/_utils_resolve_.html#resolve) helper). The [[pending]] can also be caught by the
 * [[ifPending]] in order to return a fallback or previous value for a given path. See the
 * [[ifPending]] documentation to learn more.
 */
export function pending(): PendingNodeDefinition {
  return INSTANCE;
}

export function isPendingNodeDefinition(value: NodeDefinition): value is PendingNodeDefinition {
  return value.type === PendingNodeType;
}
