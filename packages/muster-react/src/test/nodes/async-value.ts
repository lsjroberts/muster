import {
  createNodeDefinition,
  createNodeType,
  graphTypes,
  NodeDefinition,
  NodeExecutionContext,
  pending,
  StatefulGraphNode,
  StatefulNodeType,
  toValue,
  types,
} from '@dws/muster';

export interface AsyncValueNode
  extends StatefulGraphNode<
      'async-value',
      AsyncValueNodeProperties,
      AsyncValueNodeState,
      AsyncValueNodeData
    > {}

export interface AsyncValueNodeDefinition
  extends NodeDefinition<
      'async-value',
      AsyncValueNodeProperties,
      AsyncValueNodeState,
      AsyncValueNodeData
    > {}

export interface AsyncValueNodeProperties {
  value: any;
}

export interface AsyncValueNodeState {
  currentValue: NodeDefinition;
}

export interface AsyncValueNodeData {}

export const AsyncValueNodeType: StatefulNodeType<
  'async-value',
  AsyncValueNodeProperties,
  AsyncValueNodeState
> = createNodeType<'async-value', AsyncValueNodeProperties, AsyncValueNodeState>('async-value', {
  state: {
    currentValue: graphTypes.nodeDefinition,
  },
  shape: {
    value: types.any,
  },
  getInitialState(): AsyncValueNodeState {
    return {
      currentValue: pending(),
    };
  },
  operations: {
    evaluate: {
      run(
        node: AsyncValueNode,
        options: never,
        dependencies: Array<never>,
        context: Array<never>,
        state: AsyncValueNodeState,
      ): NodeDefinition {
        return state.currentValue;
      },
      onSubscribe(
        this: NodeExecutionContext<AsyncValueNodeState, AsyncValueNodeData>,
        node: AsyncValueNode,
      ): void {
        setTimeout(() => {
          this.setState({
            currentValue: toValue(node.definition.properties.value),
          });
        });
      },
    },
  },
});

export function asyncValue(value: any): AsyncValueNodeDefinition {
  return createNodeDefinition(AsyncValueNodeType, {
    value,
  });
}

export function isAsyncValueNodeDefinition(
  value: NodeDefinition,
): value is AsyncValueNodeDefinition {
  return value.type === AsyncValueNodeType;
}
