import { error } from '../nodes/graph/error';
import { isParamContextId, parseContextIdParamName } from '../nodes/graph/tree';
import { identityOperation } from '../operations/identity';
import {
  ContextDependency,
  Dependency,
  GraphNode,
  RequiredContextDependency,
} from '../types/graph';
import parseNodeDependency from './parse-node-dependency';

export default function parseContextDependency(
  node: GraphNode,
  dependency: ContextDependency,
): Dependency {
  // TODO: Remove the `as any` cast once https://github.com/Microsoft/TypeScript/issues/1863 is resolved
  const contextValue = node.context.values[dependency.name as any];
  if (!contextValue) {
    if (isRequiredContextDependency(dependency)) {
      const errorMessage = getMissingContextValueErrorMessage(dependency, node);
      return {
        target: error(errorMessage),
        operation: identityOperation(),
        allowErrors: true,
        allowPending: false,
        invalidate: Boolean(dependency.invalidate),
      };
    }
    return {
      target: dependency.defaultValue,
      operation: identityOperation(),
      allowErrors: true,
      allowPending: true,
      invalidate: Boolean(dependency.invalidate),
    };
  }
  return parseNodeDependency(contextValue, dependency);
}

function isRequiredContextDependency(value: ContextDependency): value is RequiredContextDependency {
  return Boolean(value.required) && !(typeof value === 'string');
}

function getMissingContextValueErrorMessage(
  dependency: RequiredContextDependency,
  node: GraphNode,
): string {
  if (typeof dependency.required === 'function') {
    return dependency.required(node, dependency.name);
  }
  if (typeof dependency.required === 'string') {
    return dependency.required;
  }
  if (isParamContextId(dependency.name)) {
    return `Parameter not found: "${parseContextIdParamName(dependency.name)}"`;
  }
  return `Missing context dependency: "${dependency.name.toString()}"`;
}
