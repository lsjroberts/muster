import { isNodeDefinition, NodeDefinition } from '../../../types/graph';
import { getInvalidTypeErrorMessage } from '../../../utils/get-invalid-type-error';
import { array, isArrayNodeDefinition } from '../../collection/array';
import { error, ErrorNodeDefinition, isErrorNodeDefinition } from '../../graph/error';
import { isTreeNodeDefinition, tree } from '../../graph/tree';
import { ResponseTransformer } from '../middlewares/transform-response-middleware';

export interface ErrorResponseHandler {
  (e: ErrorNodeDefinition): NodeDefinition | undefined;
}

export function handleErrors(transform: ErrorResponseHandler): ResponseTransformer {
  return (node: NodeDefinition): NodeDefinition => {
    return transformResult(node, transform);
  };
}

function transformResult(result: NodeDefinition, transform: ErrorResponseHandler): NodeDefinition {
  if (isErrorNodeDefinition(result)) {
    const transformedValue = transform(result);
    if (!isNodeDefinition(transformedValue)) {
      return error(
        getInvalidTypeErrorMessage('Invalid handleErrors transform return value', {
          expected: ['NodeDefinition'],
          received: transformedValue,
        }),
      );
    }
    return transformedValue;
  }
  if (isTreeNodeDefinition(result)) {
    return tree(
      result.properties.branches.map((branch) => ({
        ...branch,
        node: transformResult(branch.node, transform),
      })),
    );
  }
  if (isArrayNodeDefinition(result)) {
    return array(result.properties.items.map((item) => transformResult(item, transform)));
  }
  return result;
}
