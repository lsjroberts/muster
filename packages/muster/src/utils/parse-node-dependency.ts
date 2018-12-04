import { once } from '../nodes/graph/once';
import { resolveOperation } from '../operations/resolve';
import { Dependency, DependencyOptions, GraphNode, NodeDefinition } from '../types/graph';
import { getInvalidTypeErrorMessage } from './get-invalid-type-error';

export default function parseNodeDependency(
  target: GraphNode | NodeDefinition,
  options: DependencyOptions,
): Dependency {
  return {
    target: options.once ? once(target) : target,
    operation: resolveOperation({
      until: options.until && {
        predicate: options.until.predicate,
        errorMessage: options.until.errorMessage || unmetConditionErrorMessage,
      },
      allowErrors: Boolean(options.allowErrors),
      allowPending: Boolean(options.allowPending),
      acceptNil: Boolean(options.acceptNil),
    }),
    allowErrors: Boolean(options.allowErrors),
    allowPending: Boolean(options.allowPending),
    invalidate: Boolean(options.invalidate),
  };
}

function unmetConditionErrorMessage(node: GraphNode) {
  return getInvalidTypeErrorMessage('Resolve terminated without meeting condition', {
    received: node.definition,
  });
}
