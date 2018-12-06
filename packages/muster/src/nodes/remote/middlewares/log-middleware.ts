import {
  NodeDefinition,
  StatelessGraphNode,
  StatelessNodeDefinition,
  StatelessNodeType,
} from '../../../types/graph';
import createNodeDefinition from '../../../utils/create-node-definition';
import { createNodeType } from '../../../utils/create-node-type';
import getType from '../../../utils/get-type';
import * as types from '../../../utils/types';
import withScopeFrom from '../../../utils/with-scope-from';
import { error, resolve, traverse } from '../../graph';
import { requestOperation, RequestOperation } from '../operations/request';

export interface LogMiddlewareNode
  extends StatelessGraphNode<'log-middleware', LogMiddlewareNodeProperties> {}
export interface LogMiddlewareNodeDefinition
  extends StatelessNodeDefinition<'log-middleware', LogMiddlewareNodeProperties> {}

export type LogSink = (...args: Array<any>) => void;

export interface LogMiddlewareNodeProperties {
  logRequests: boolean;
  logResponses: boolean;
  sink: LogSink;
}

export const LogMiddlewareNodeType: StatelessNodeType<
  'log-middleware',
  LogMiddlewareNodeProperties
> = createNodeType<'log-middleware', LogMiddlewareNodeProperties>('log-middleware', {
  shape: {
    logRequests: types.bool,
    logResponses: types.bool,
    sink: types.saveHash(types.func),
  },
  operations: {
    request: {
      run(node: LogMiddlewareNode, operation: RequestOperation): NodeDefinition {
        const { logRequests, logResponses, sink } = node.definition.properties;
        const { metadata, next, query } = operation.properties;
        if (!next) {
          return error('LogMiddleware cannot be used as a base middleware.');
        }
        if (logRequests) {
          sink(`Request [${operation.id}]:`, getType(operation.properties.query));
        }
        return resolve(
          [
            {
              target: withScopeFrom(
                next,
                traverse(next.definition, requestOperation(query, metadata)),
              ),
              allowErrors: true,
            },
          ],
          ([response]) => {
            if (logResponses) {
              sink(`Response [${operation.id}]:`, getType(response.definition));
            }
            return response;
          },
        );
      },
    },
  },
});

export interface LogMiddlewareOptions {
  logRequests?: boolean;
  logResponses?: boolean;
  sink?: LogSink;
}

export function logMiddleware(options: LogMiddlewareOptions = {}): LogMiddlewareNodeDefinition {
  return createNodeDefinition(LogMiddlewareNodeType, {
    logRequests: typeof options.logRequests === 'boolean' ? options.logRequests : true,
    logResponses: typeof options.logResponses === 'boolean' ? options.logResponses : true,
    sink: options.sink || console.log,
  });
}
