import { ValueNode, ValueNodeType } from '../nodes/graph/value';
import { GraphNode, NodeDependencyUntilCondition, NodeType } from '../types/graph';
import { getInvalidTypeError } from './get-invalid-type-error';

export function isPositiveIntegerValueNode(node: GraphNode): node is ValueNode<number> {
  return (
    ValueNodeType.is(node) &&
    typeof node.definition.properties.value === 'number' &&
    Number.isInteger(node.definition.properties.value) &&
    node.definition.properties.value >= 0
  );
}

export function untilPositiveIntegerValueNode(
  nodeType: NodeType,
  paramName: string,
): NodeDependencyUntilCondition {
  return {
    predicate: isPositiveIntegerValueNode,
    errorMessage(node: GraphNode) {
      return getInvalidTypeError(
        [
          `'${nodeType.name}' node expected '${paramName}' to resolve to a`,
          'positive integer value() node.',
        ].join(' '),
        {
          expected: ValueNodeType,
          received: node.definition,
        },
      ).message;
    },
  };
}
