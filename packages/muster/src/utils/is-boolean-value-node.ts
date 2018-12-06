import { ValueNode, ValueNodeType } from '../nodes/graph/value';
import { GraphNode, NodeDependencyUntilCondition, NodeType } from '../types/graph';
import { getInvalidTypeErrorMessage } from './get-invalid-type-error';

export function isBooleanValueNode(node: GraphNode): node is ValueNode<boolean> {
  return ValueNodeType.is(node) && typeof node.definition.properties.value === 'boolean';
}

export function untilBooleanValueNode(
  nodeType: NodeType,
  paramName: string,
): NodeDependencyUntilCondition {
  return {
    predicate: isBooleanValueNode,
    errorMessage(node: GraphNode) {
      return getInvalidTypeErrorMessage(
        `'${nodeType.name}' node expected '${paramName}' to resolve to a boolean value() node.`,
        {
          expected: ValueNodeType,
          received: node.definition,
        },
      );
    },
  };
}
