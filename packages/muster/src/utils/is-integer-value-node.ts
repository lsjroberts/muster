import { ValueNode, ValueNodeType } from '../nodes/graph/value';
import { GraphNode, NodeDependencyUntilCondition, NodeType } from '../types/graph';
import { getInvalidTypeErrorMessage } from './get-invalid-type-error';

export function isIntegerValueNode(node: GraphNode): node is ValueNode<number> {
  return (
    ValueNodeType.is(node) &&
    typeof node.definition.properties.value === 'number' &&
    Number.isInteger(node.definition.properties.value)
  );
}

export function untilIntegerValueNode(
  nodeType: NodeType,
  paramName: string,
): NodeDependencyUntilCondition {
  return {
    predicate: isIntegerValueNode,
    errorMessage(node: GraphNode) {
      return getInvalidTypeErrorMessage(
        `'${nodeType.name}' node expected '${paramName}' to resolve to an integer value() node.`,
        {
          expected: ValueNodeType,
          received: node.definition,
        },
      );
    },
  };
}
