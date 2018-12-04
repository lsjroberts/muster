import { ObservableLike } from '@dws/muster-observable';
import {
  NodeDefinition,
  StatelessGraphNode,
  StatelessNodeDefinition,
  StatelessNodeType,
} from '../../../types/graph';
import createNodeDefinition from '../../../utils/create-node-definition';
import { createNodeType } from '../../../utils/create-node-type';
import * as types from '../../../utils/types';
import { fromStream } from '../../graph/from-stream';
import { RequestOperation } from '../operations/request';

export type StreamFactory = (request: NodeDefinition) => ObservableLike<NodeDefinition>;

export interface FromStreamMiddlewareNode
  extends StatelessGraphNode<'from-stream-middleware', FromStreamMiddlewareNodeProperties> {}
export interface FromStreamMiddlewareNodeDefinition
  extends StatelessNodeDefinition<'from-stream-middleware', FromStreamMiddlewareNodeProperties> {}

export interface FromStreamMiddlewareNodeProperties {
  streamFactory: StreamFactory;
}

export const FromStreamMiddlewareNodeType: StatelessNodeType<
  'from-stream-middleware',
  FromStreamMiddlewareNodeProperties
> = createNodeType<'from-stream-middleware', FromStreamMiddlewareNodeProperties>(
  'from-stream-middleware',
  {
    shape: {
      streamFactory: types.saveHash(types.func),
    },
    operations: {
      request: {
        run(node: FromStreamMiddlewareNode, operation: RequestOperation): NodeDefinition {
          const responseStream = node.definition.properties.streamFactory(
            operation.properties.query,
          );
          return fromStream(responseStream);
        },
      },
    },
  },
);

export function fromStreamMiddleware(
  streamFactory: StreamFactory,
): FromStreamMiddlewareNodeDefinition {
  return createNodeDefinition(FromStreamMiddlewareNodeType, {
    streamFactory,
  });
}
