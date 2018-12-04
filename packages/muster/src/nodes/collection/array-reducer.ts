import {
  GraphNode,
  StatelessGraphNode,
  StatelessNodeDefinition,
  StatelessNodeType,
} from '../../types/graph';
import createNodeDefinition from '../../utils/create-node-definition';
import { createNodeType } from '../../utils/create-node-type';
import { value, ValueNodeDefinition } from '../graph/value';
import { nodeList, NodeListNodeDefinition } from './node-list';
import { ResultOperation } from './operations/result';
import { StepOperation } from './operations/step';

export interface ArrayReducerNode
  extends StatelessGraphNode<'arrayReducer', ArrayReducerNodeProperties> {}
export interface ArrayReducerNodeDefinition
  extends StatelessNodeDefinition<'arrayReducer', ArrayReducerNodeProperties> {}

export interface ArrayReducerNodeProperties {}

export type ArrayReducerAccumulator = Array<GraphNode>;

export const ArrayReducerNodeType: StatelessNodeType<
  'arrayReducer',
  ArrayReducerNodeProperties
> = createNodeType('arrayReducer', {
  operations: {
    init: {
      run(): ValueNodeDefinition<ArrayReducerAccumulator> {
        return value([]);
      },
    },
    step: {
      run(
        node: ArrayReducerNode,
        operation: StepOperation<ArrayReducerAccumulator>,
      ): ValueNodeDefinition<ArrayReducerAccumulator> {
        const { acc, item } = operation.properties;
        return value([...acc, item]);
      },
    },
    result: {
      run(
        node: ArrayReducerNode,
        operation: ResultOperation<ArrayReducerAccumulator>,
      ): ValueNodeDefinition<NodeListNodeDefinition> {
        return value(nodeList(operation.properties.acc));
      },
    },
  },
});

const INSTANCE = createNodeDefinition(ArrayReducerNodeType, {});

export function arrayReducer(): ArrayReducerNodeDefinition {
  return INSTANCE;
}
