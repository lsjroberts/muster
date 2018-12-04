import {
  GraphNode,
  isGraphNode,
  NodeDefinition,
  NodeDependencyUntilCondition,
  NodeType,
  StatefulGraphNode,
  StatefulNodeDefinition,
} from '../types/graph';
import { getInvalidTypeError } from './get-invalid-type-error';
import isStatefulNodeType from './is-stateful-node-type';

/* tslint:disable:max-line-length */
export function isStatefulNode(node: NodeDefinition): node is StatefulNodeDefinition;
export function isStatefulNode(node: GraphNode): node is StatefulGraphNode;
export function isStatefulNode(
  node: NodeDefinition | GraphNode,
): node is StatefulNodeDefinition | StatefulGraphNode;
/* tslint:disable:max-line-length */
export function isStatefulNode(
  node: GraphNode | NodeDefinition,
): node is StatefulGraphNode | StatefulNodeDefinition {
  const nodeType = (isGraphNode(node) ? node.definition : node).type;
  return isStatefulNodeType(nodeType);
}

export function untilStatefulValueNode(
  nodeType: NodeType,
  paramName: string,
): NodeDependencyUntilCondition {
  return {
    predicate: isStatefulNode,
    errorMessage(node: GraphNode) {
      return getInvalidTypeError(
        `'${nodeType.name}' node expected '${paramName}' to resolve to a stateful node.`,
        {
          expected: ['StatefulNode'],
          received: node.definition,
        },
      ).message;
    },
  };
}
