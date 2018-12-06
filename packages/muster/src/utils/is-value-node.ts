import { ValueNodeType } from '../nodes/graph/value';
import { GraphNode, NodeDependencyUntilCondition, NodeType } from '../types/graph';
import { getInvalidTypeError } from './get-invalid-type-error';

export function untilValueNode(
  nodeType: NodeType,
  paramName: string,
): NodeDependencyUntilCondition {
  return {
    predicate: ValueNodeType.is,
    errorMessage(node: GraphNode) {
      return getInvalidTypeError(
        `'${nodeType.name}' node expected '${paramName}' to resolve to a value() node.`,
        {
          expected: ValueNodeType,
          received: node.definition,
        },
      ).message;
    },
  };
}
