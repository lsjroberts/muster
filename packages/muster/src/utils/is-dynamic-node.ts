import {
  DynamicGraphNode,
  DynamicNodeDefinition,
  GraphNode,
  isGraphNode,
  NodeDefinition,
  NodeDependencyUntilCondition,
  NodeType,
} from '../types/graph';
import { getInvalidTypeErrorMessage } from './get-invalid-type-error';
import isDynamicNodeType from './is-dynamic-node-type';

/* tslint:disable:max-line-length */
export function isDynamicNode(node: NodeDefinition): node is DynamicNodeDefinition;
export function isDynamicNode(node: GraphNode): node is DynamicGraphNode;
export function isDynamicNode(
  node: NodeDefinition | GraphNode,
): node is DynamicNodeDefinition | DynamicGraphNode;
/* tslint:enable:max-line-length */
export function isDynamicNode(
  node: GraphNode | NodeDefinition,
): node is DynamicNodeDefinition | DynamicGraphNode {
  const nodeType = (isGraphNode(node) ? node.definition : node).type;
  return isDynamicNodeType(nodeType);
}

export function untilDynamicNode(
  nodeType: NodeType,
  paramName: string,
): NodeDependencyUntilCondition {
  return {
    predicate: isDynamicNode,
    errorMessage(node: GraphNode) {
      return getInvalidTypeErrorMessage(
        `'${nodeType.name}' node expected '${paramName}' to resolve to a dynamic node.`,
        {
          expected: ['DynamicNode'],
          received: node.definition,
        },
      );
    },
  };
}
