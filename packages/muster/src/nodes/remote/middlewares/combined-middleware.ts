import {
  GraphNode,
  NodeDefinition,
  StatelessGraphNode,
  StatelessNodeDefinition,
  StatelessNodeType,
} from '../../../types/graph';
import createNodeDefinition from '../../../utils/create-node-definition';
import createOperationComposer, {
  OperationComposerProperties,
} from '../../../utils/create-operation-composer';
import { RequestOperation } from '../operations/request';

export interface CombinedMiddlewareNode
  extends StatelessGraphNode<'combined-middleware', CombinedMiddlewareNodeProperties> {}

export interface CombinedMiddlewareNodeDefinition
  extends StatelessNodeDefinition<'combined-middleware', CombinedMiddlewareNodeProperties> {}

export interface CombinedMiddlewareNodeProperties extends OperationComposerProperties {}

export const CombinedMiddlewareNodeType: StatelessNodeType<
  'combined-middleware',
  CombinedMiddlewareNodeProperties
> = createOperationComposer<
  'combined-middleware',
  RequestOperation['type']['name'],
  RequestOperation
>('combined-middleware', ['request']);

export function combinedMiddleware(
  current: NodeDefinition | GraphNode,
  next: NodeDefinition | GraphNode,
): CombinedMiddlewareNodeDefinition {
  return createNodeDefinition(CombinedMiddlewareNodeType, {
    current,
    next,
  });
}
