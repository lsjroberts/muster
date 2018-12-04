import { RegexNodeType } from '../nodes/string/regex';
import { GraphNode, NodeDependencyUntilCondition, NodeType } from '../types/graph';
import { getInvalidTypeError } from './get-invalid-type-error';

export function untilRegexNode(
  nodeType: NodeType,
  paramName: string,
): NodeDependencyUntilCondition {
  return {
    predicate: RegexNodeType.is,
    errorMessage(node: GraphNode) {
      return getInvalidTypeError(
        `'${nodeType.name}' node expected '${paramName}' to resolve to a regex node.`,
        {
          expected: RegexNodeType,
          received: node.definition,
        },
      ).message;
    },
  };
}
