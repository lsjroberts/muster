import debounce from 'lodash/debounce';
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

export interface OnGlobalEventDebouncedNode
  extends StatefulGraphNode<
      'on-global-event-debounced',
      OnGlobalEventDebouncedNodeProperties,
      OnGlobalEventDebouncedState,
      OnGlobalEventDebouncedData
    > {}

export interface OnGlobalEventDebouncedNodeDefinition
  extends StatefulNodeDefinition<
      'on-global-event-debounced',
      OnGlobalEventDebouncedNodeProperties,
      OnGlobalEventDebouncedState,
      OnGlobalEventDebouncedData
    > {}

export interface OnGlobalEventDebouncedNodeProperties {
  delay: number;
  eventType: string | symbol;
  factory: () => NodeDefinition;
}

export interface OnGlobalEventDebouncedState extends NodeState {
  currentValue: NodeDefinition;
}

export interface OnGlobalEventDebouncedData {
  disposeGlobalEventListener: (() => void) | undefined;
}

export const OnGlobalEventDebouncedNodeType: StatefulNodeType<
  'on-global-event-debounced',
  OnGlobalEventDebouncedNodeProperties,
  OnGlobalEventDebouncedState,
  OnGlobalEventDebouncedData
> = createNodeType<
  'on-global-event-debounced',
  OnGlobalEventDebouncedNodeProperties,
  OnGlobalEventDebouncedState,
  OnGlobalEventDebouncedData
>('on-global-event-debounced', {
  shape: {
    delay: types.number,
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
        node: OnGlobalEventDebouncedNode,
        operation: never,
        dependencies: never,
        context: never,
        state: OnGlobalEventDebouncedState,
      ): NodeDefinition {
        return state.currentValue;
      },
      onSubscribe(
        this: NodeExecutionContext<OnGlobalEventDebouncedState, OnGlobalEventDebouncedData>,
        node: OnGlobalEventDebouncedNode,
      ): void {
        const { delay, eventType, factory } = node.definition.properties;
        const debouncedCallback = debounce(() => {
          this.setState((state) => ({
            ...state,
            currentValue: factory(),
          }));
        }, delay);
        this.setData({
          disposeGlobalEventListener: node.scope.globalEvents.listen((event) => {
            if (event.type !== eventType) return;
            debouncedCallback();
          }),
        });
      },
      onUnsubscribe(
        this: NodeExecutionContext<OnGlobalEventDebouncedState, OnGlobalEventDebouncedData>,
      ): void {
        const { disposeGlobalEventListener } = this.getData();
        disposeGlobalEventListener && disposeGlobalEventListener();
      },
    },
  },
});

export function onGlobalEventDebounced(
  eventType: string | symbol,
  delay: number = 100,
): SchedulerFactory {
  return (factory: () => NodeDefinition) => {
    return createNodeDefinition(OnGlobalEventDebouncedNodeType, {
      eventType,
      factory,
      delay,
    });
  };
}

export function isOnGlobalEventDebouncedNodeDefinition(
  value: NodeDefinition,
): value is OnGlobalEventDebouncedNodeDefinition {
  return value.type === OnGlobalEventDebouncedNodeType;
}
