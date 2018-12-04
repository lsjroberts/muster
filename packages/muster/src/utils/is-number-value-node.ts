import { ValueNode, ValueNodeType } from '../nodes/graph/value';
import { GraphNode, NodeDependencyUntilCondition, NodeType } from '../types/graph';
import { getInvalidTypeErrorMessage } from './get-invalid-type-error';

export function isNumberValueNode(node: GraphNode): node is ValueNode<number> {
  return ValueNodeType.is(node) && typeof node.definition.properties.value === 'number';
}

export function untilNumberValueNode(
  nodeType: NodeType,
  paramName: string,
): NodeDependencyUntilCondition {
  return {
    predicate: isNumberValueNode,
    errorMessage(node: GraphNode) {
      return getInvalidTypeErrorMessage(
        `'${nodeType.name}' node expected '${paramName}' to resolve to a numeric value() node.`,
        {
          expected: ValueNodeType,
          received: node.definition,
        },
      );
    },
  };
}
