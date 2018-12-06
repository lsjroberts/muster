import { ObservableLike, Subscription } from '@dws/muster-observable';
import {
  NodeDefinition,
  NodeExecutionContext,
  NodeState,
  StatefulGraphNode,
  StatefulNodeDefinition,
  StatefulNodeType,
} from '../../../types/graph';
import createNodeDefinition from '../../../utils/create-node-definition';
import { createNodeType } from '../../../utils/create-node-type';
import * as graphTypes from '../../../utils/graph-types';
import * as types from '../../../utils/types';
import { pending } from '../../graph/pending';
import { SchedulerFactory } from './types';

export interface OnStreamEmissionNode
  extends StatefulGraphNode<
      'on-stream-emission',
      OnStreamEmissionNodeProperties,
      OnStreamEmissionState,
      OnStreamEmissionData
    > {}

export interface OnStreamEmissionNodeDefinition
  extends StatefulNodeDefinition<
      'on-stream-emission',
      OnStreamEmissionNodeProperties,
      OnStreamEmissionState,
      OnStreamEmissionData
    > {}

export interface OnStreamEmissionNodeProperties {
  factory: () => NodeDefinition;
  stream: ObservableLike<any>;
}

export interface OnStreamEmissionState extends NodeState {
  currentValue: NodeDefinition;
}

export interface OnStreamEmissionData {
  streamSubscription: Subscription;
}

export const OnStreamEmissionNodeType: StatefulNodeType<
  'on-stream-emission',
  OnStreamEmissionNodeProperties,
  OnStreamEmissionState,
  OnStreamEmissionData
> = createNodeType<
  'on-stream-emission',
  OnStreamEmissionNodeProperties,
  OnStreamEmissionState,
  OnStreamEmissionData
>('on-stream-emission', {
  shape: {
    factory: types.saveHash(types.func),
    stream: types.saveHash(types.any),
  },
  state: {
    currentValue: graphTypes.nodeDefinition,
  },
  getInitialState() {
    return {
      currentValue: pending(),
    };
  },
  operations: {
    evaluate: {
      run(
        node: OnStreamEmissionNode,
        operation: never,
        dependencies: never,
        context: never,
        state: OnStreamEmissionState,
      ): NodeDefinition {
        return state.currentValue;
      },
      onSubscribe(
        this: NodeExecutionContext<OnStreamEmissionState, OnStreamEmissionData>,
        node: OnStreamEmissionNode,
      ): void {
        const { factory, stream } = node.definition.properties;
        this.setData({
          streamSubscription: stream.subscribe(() => {
            this.setState((state) => ({
              ...state,
              currentValue: factory(),
            }));
          }),
        });
      },
      onUnsubscribe(this: NodeExecutionContext<OnStreamEmissionState, OnStreamEmissionData>): void {
        const { streamSubscription } = this.getData();
        streamSubscription && streamSubscription.unsubscribe();
      },
    },
  },
});

export function onStreamEmission(stream: ObservableLike<any>): SchedulerFactory {
  return (factory: () => NodeDefinition) => {
    return createNodeDefinition(OnStreamEmissionNodeType, {
      factory,
      stream,
    });
  };
}

export function isOnStreamEmissionNodeDefinition(
  value: NodeDefinition,
): value is OnStreamEmissionNodeDefinition {
  return value.type === OnStreamEmissionNodeType;
}
