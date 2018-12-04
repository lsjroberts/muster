import {
  NodeDefinition,
  StatelessGraphNode,
  StatelessNodeDefinition,
  StatelessNodeType,
} from '../../../types/graph';
import createNodeDefinition from '../../../utils/create-node-definition';
import { createNodeType } from '../../../utils/create-node-type';
import * as types from '../../../utils/types';
import { RequestOperation } from '../operations/request';

export type ResponseFactory = (request: NodeDefinition) => NodeDefinition;

export interface MockResponseMiddlewareNode
  extends StatelessGraphNode<'mock-response-middleware', MockResponseMiddlewareNodeProperties> {}
export interface MockResponseMiddlewareNodeDefinition
  extends StatelessNodeDefinition<
      'mock-response-middleware',
      MockResponseMiddlewareNodeProperties
    > {}

export interface MockResponseMiddlewareNodeProperties {
  responseFactory: ResponseFactory;
}

export const MockResponseMiddlewareNodeType: StatelessNodeType<
  'mock-response-middleware',
  MockResponseMiddlewareNodeProperties
> = createNodeType('mock-response-middleware', {
  shape: {
    responseFactory: types.saveHash(types.func),
  },
  operations: {
    request: {
      run(node: MockResponseMiddlewareNode, operation: RequestOperation): NodeDefinition {
        return node.definition.properties.responseFactory(operation.properties.query);
      },
    },
  },
});

export function mockResponseMiddleware(
  responseFactory: ResponseFactory,
): MockResponseMiddlewareNodeDefinition {
  return createNodeDefinition(MockResponseMiddlewareNodeType, {
    responseFactory,
  });
}
