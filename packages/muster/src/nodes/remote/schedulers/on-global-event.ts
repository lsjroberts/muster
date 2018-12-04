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

export interface OnGlobalEventNode
  extends StatefulGraphNode<
      'on-global-event',
      OnGlobalEventNodeProperties,
      OnGlobalEventState,
      OnGlobalEventData
    > {}

export interface OnGlobalEventNodeDefinition
  extends StatefulNodeDefinition<
      'on-global-event',
      OnGlobalEventNodeProperties,
      OnGlobalEventState,
      OnGlobalEventData
    > {}

export interface OnGlobalEventNodeProperties {
  eventType: string | symbol;
  factory: () => NodeDefinition;
}

export interface OnGlobalEventState extends NodeState {
  currentValue: NodeDefinition;
}

export interface OnGlobalEventData {
  disposeGlobalEventListener: (() => void) | undefined;
}

export const OnGlobalEventNodeType: StatefulNodeType<
  'on-global-event',
  OnGlobalEventNodeProperties,
  OnGlobalEventState,
  OnGlobalEventData
> = createNodeType<
  'on-global-event',
  OnGlobalEventNodeProperties,
  OnGlobalEventState,
  OnGlobalEventData
>('on-global-event', {
  shape: {
    eventType: types.oneOfType([types.string, types.symbol]),
    factory: types.saveHash(types.func),
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
        node: OnGlobalEventNode,
        operation: never,
        dependencies: never,
        context: never,
        state: OnGlobalEventState,
      ): NodeDefinition {
        return state.currentValue;
      },
      onSubscribe(
        this: NodeExecutionContext<OnGlobalEventState, OnGlobalEventData>,
        node: OnGlobalEventNode,
      ): void {
        const { eventType, factory } = node.definition.properties;
        this.setData({
          disposeGlobalEventListener: node.scope.globalEvents.listen((event) => {
            if (event.type !== eventType) return;
            this.setState((state) => ({
              ...state,
              currentValue: factory(),
            }));
          }),
        });
      },
      onUnsubscribe(this: NodeExecutionContext<OnGlobalEventState, OnGlobalEventData>): void {
        const { disposeGlobalEventListener } = this.getData();
        disposeGlobalEventListener && disposeGlobalEventListener();
      },
    },
  },
});

export function onGlobalEvent(eventType: string | symbol): SchedulerFactory {
  return (factory: () => NodeDefinition) => {
    return createNodeDefinition(OnGlobalEventNodeType, {
      eventType,
      factory,
    });
  };
}

export function isOnGlobalEventNodeDefinition(
  value: NodeDefinition,
): value is OnGlobalEventNodeDefinition {
  return value.type === OnGlobalEventNodeType;
}
