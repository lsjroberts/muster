import { isGraphNode } from '../../types/graph';
import createNodeDefinition from '../../utils/create-node-definition';
import {
  ErrorNode,
  ErrorNodeDefinition,
  ErrorNodeProperties,
  ErrorNodeType,
  isErrorNodeDefinition,
} from './error';

export const NOT_FOUND = 'NOT_FOUND';

export function isNotFoundNode(value: any): value is ErrorNode {
  return isGraphNode(value) && isNotFoundNodeDefinition(value.definition);
}

export function isNotFoundNodeDefinition(value: any): value is ErrorNodeDefinition {
  return isErrorNodeDefinition(value) && value.properties.code === NOT_FOUND;
}

/**
 * Creates an instance of the [[error]] node with the code set to [[NOT_FOUND]]. This error is used by Muster to indicate
 * that a given resource could not be found.
 * See the [[error]] documentation to find out more.
 */
export function notFound(
  message: string | Error | { message: string; stack?: string },
  data?: any,
): ErrorNodeDefinition {
  return createNodeDefinition(ErrorNodeType, {
    error: typeof message === 'string' ? new Error(message) : message,
    code: NOT_FOUND,
    data:
      typeof data !== 'undefined'
        ? data
        : typeof message === 'object' && 'data' in message
          ? (message as any).data
          : undefined,
  } as ErrorNodeProperties);
}
