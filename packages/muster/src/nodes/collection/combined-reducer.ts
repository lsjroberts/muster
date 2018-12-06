import {
  GraphNode,
  NodeDefinition,
  StatelessGraphNode,
  StatelessNodeDefinition,
  StatelessNodeType,
} from '../../types/graph';
import createNodeDefinition from '../../utils/create-node-definition';
import createOperationComposer, {
  OperationComposerProperties,
} from '../../utils/create-operation-composer';
import { InitOperation } from './operations/init';
import { ResultOperation } from './operations/result';
import { StepOperation } from './operations/step';

export type TransformOperation = InitOperation | StepOperation<any> | ResultOperation<any>;

export interface CombinedReducerNode
  extends StatelessGraphNode<'combinedReducer', CombinedReducerNodeProperties> {}
export interface CombinedReducerNodeDefinition
  extends StatelessNodeDefinition<'combinedReducer', CombinedReducerNodeProperties> {}

export interface CombinedReducerNodeProperties extends OperationComposerProperties {}

const CombinedReducerNodeType: StatelessNodeType<
  'combinedReducer',
  CombinedReducerNodeProperties
> = createOperationComposer<
  'combinedReducer',
  TransformOperation['type']['name'],
  TransformOperation
>('combinedReducer', ['init', 'step', 'result']);

export function combinedReducer(
  current: NodeDefinition | GraphNode,
  next: NodeDefinition | GraphNode,
): CombinedReducerNodeDefinition {
  return createNodeDefinition(CombinedReducerNodeType, {
    current,
    next,
  });
}
