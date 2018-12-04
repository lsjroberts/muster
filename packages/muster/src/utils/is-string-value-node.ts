import { ValueNode, ValueNodeType } from '../nodes/graph/value';
import { GraphNode, NodeDependencyUntilCondition, NodeType } from '../types/graph';
import { getInvalidTypeError } from './get-invalid-type-error';

export function isStringValueNode(node: GraphNode): node is ValueNode<string> {
  return ValueNodeType.is(node) && typeof node.definition.properties.value === 'string';
}

export function untilStringValueNode(
  nodeType: NodeType,
  paramName: string,
): NodeDependencyUntilCondition {
  return {
    predicate: isStringValueNode,
    errorMessage(node: GraphNode) {
      return getInvalidTypeError(
        `'${nodeType.name}' node expected '${paramName}' to resolve to a string value() node.`,
        {
          expected: ['value(string)'],
          received: node.definition,
        },
      ).message;
    },
  };
}
