import {
  NodeDefinition,
  StatelessGraphNode,
  StatelessNodeDefinition,
  StatelessNodeType,
} from '../../../types/graph';
import createNodeDefinition from '../../../utils/create-node-definition';
import { createNodeType } from '../../../utils/create-node-type';
import * as types from '../../../utils/types';
import withScopeFrom from '../../../utils/with-scope-from';
import { error } from '../../graph/error';
import { resolve } from '../../graph/resolve';
import { traverse } from '../../graph/traverse';
import { requestOperation, RequestOperation } from '../operations/request';

export type ResponseTransformer = (value: NodeDefinition) => NodeDefinition;

export interface TransformResponseMiddlewareNode
  extends StatelessGraphNode<
      'transform-response-middleware',
      TransformResponseMiddlewareNodeProperties
    > {}
export interface TransformResponseMiddlewareNodeDefinition
  extends StatelessNodeDefinition<
      'transform-response-middleware',
      TransformResponseMiddlewareNodeProperties
    > {}

export interface TransformResponseMiddlewareNodeProperties {
  responseTransformer: ResponseTransformer;
}

export const TransformResponseMiddlewareNodeType: StatelessNodeType<
  'transform-response-middleware',
  TransformResponseMiddlewareNodeProperties
> = createNodeType('transform-response-middleware', {
  shape: {
    responseTransformer: types.saveHash(types.func),
  },
  operations: {
    request: {
      run(node: TransformResponseMiddlewareNode, operation: RequestOperation): NodeDefinition {
        const { metadata, next, query } = operation.properties;
        if (!next) {
          return error('TransformResponseMiddleware cannot be used as a base middleware.');
        }
        const { responseTransformer } = node.definition.properties;
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
          ([response]) => withScopeFrom(response, responseTransformer(response.definition)),
        );
      },
    },
  },
});

export function transformResponseMiddleware(
  responseTransformer: ResponseTransformer,
): TransformResponseMiddlewareNodeDefinition {
  return createNodeDefinition(TransformResponseMiddlewareNodeType, {
    responseTransformer,
  });
}
