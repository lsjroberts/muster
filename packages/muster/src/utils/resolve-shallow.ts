import { supportsEvaluateOperation } from '../operations/evaluate';
import { GraphNode, isGraphNode, NodeDefinition, NodeDependency } from '../types/graph';

export default function resolveShallow(target: NodeDefinition | GraphNode): NodeDependency {
  if (isGraphNode(target)) {
    return {
      target,
      until: {
        predicate(node: GraphNode): boolean {
          return (
            !supportsEvaluateOperation(node) ||
            (node.definition !== target.definition ||
              node.scope !== target.scope ||
              node.context !== target.context)
          );
        },
      },
    };
  }
  return {
    target,
    until: {
      predicate(node: GraphNode): boolean {
        return !supportsEvaluateOperation(node) || node.definition !== target;
      },
    },
  };
}
