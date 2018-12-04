import { ErrorNodeType } from '../nodes/graph/error';
import { GraphNode, NodeType } from '../types/graph';
import { getInvalidTypeError } from './get-invalid-type-error';

/**
 * Creates an error used when a node has been found not to be of a correct type.
 * @param validNodeTypes
 * @param {GraphNode} node
 * @returns {Error | {message: string}}
 */
export function incorrectNodeType(
  validNodeTypes: NodeType | Array<NodeType>,
  node: GraphNode,
): Error | { message: string } {
  if (ErrorNodeType.is(node)) return node.definition.properties.error;
  const nodeTypes = Array.isArray(validNodeTypes) ? validNodeTypes : [validNodeTypes];
  return getInvalidTypeError('Invalid node type', {
    // expected: nodeTypes.map((type) => `  ${type.name}`),
    expected: nodeTypes,
    received: node.definition,
  });
}
