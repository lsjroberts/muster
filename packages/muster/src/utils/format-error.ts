import { ErrorNode, ErrorNodeDefinition } from '../nodes/graph/error';
import { ChildKey, isGraphNode, isNodeDefinition } from '../types/graph';
import formatPath from './format-path';
import { valueOf } from './value-of';

export function formatError(
  error: ErrorNodeDefinition | ErrorNode | Error | { message: string },
): Error & {
  data?: any;
  path?: Array<ChildKey>;
  remotePath?: Array<ChildKey>;
} {
  if (isGraphNode(error)) {
    return formatErrorNode(error.definition);
  }
  if (isNodeDefinition(error)) {
    return formatErrorNode(error);
  }
  if (error instanceof Error) {
    return error;
  }
  return new Error(error.message);
}

function formatErrorNode(node: ErrorNodeDefinition): Error {
  const error = valueOf(node);
  const path = node.properties.path;
  if (!path) return error;
  const errorMessage = 'originalMessage' in error ? (error as any).originalMessage : error.message;
  const messageWithPath = [errorMessage, `Path: ${formatPath(path)}`].join('\n\n');
  return Object.assign(error, {
    originalMessage: errorMessage,
    message: messageWithPath,
    stack:
      typeof error.stack === 'string'
        ? error.stack.replace(errorMessage, messageWithPath)
        : error.stack,
  });
}
