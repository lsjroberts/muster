import { History } from 'history';
import { SetOperation } from '../../operations/set';
import {
  NodeDefinition,
  NodeExecutionContext,
  StatefulGraphNode,
  StatefulNodeType,
} from '../../types/graph';
import createNodeDefinition from '../../utils/create-node-definition';
import { createNodeType } from '../../utils/create-node-type';
import * as graphTypes from '../../utils/graph-types';
import * as types from '../../utils/types';
import { dispatch } from '../graph/dispatch';
import { ok } from '../graph/ok';
import { series } from '../graph/series';
import { value } from '../graph/value';
import { getHistoryUpdater, LOCATION_CHANGED, LOCATION_PART_CHANGED } from './location-common';

export interface LocationPathNode
  extends StatefulGraphNode<
      'locationPath',
      LocationPathNodeProperties,
      LocationPathNodeState,
      LocationPathNodeData
    > {}

export interface LocationPathNodeDefinition
  extends NodeDefinition<
      'locationPath',
      LocationPathNodeProperties,
      LocationPathNodeState,
      LocationPathNodeData
    > {}

export interface LocationPathNodeProperties {
  history: History;
  update: boolean | undefined;
}

export interface LocationPathNodeState {
  currentValue: NodeDefinition;
}

export interface LocationPathNodeData {
  disposeEventListener: () => void;
  disposeHistoryListener: () => void;
}

export const LocationPathNodeType: StatefulNodeType<
  'locationPath',
  LocationPathNodeProperties,
  LocationPathNodeState
> = createNodeType<'locationPath', LocationPathNodeProperties, LocationPathNodeState>(
  'locationPath',
  {
    state: {
      currentValue: graphTypes.nodeDefinition,
    },
    shape: {
      history: types.shape({
        id: types.string,
      }),
      update: types.optional(types.bool),
    },
    getInitialState(properties: LocationPathNodeProperties): LocationPathNodeState {
      return {
        currentValue: value(properties.history.location.pathname),
      };
    },
    operations: {
      evaluate: {
        run(
          node: LocationPathNode,
          options: never,
          dependencies: Array<never>,
          context: Array<never>,
          state: LocationPathNodeState,
        ): NodeDefinition {
          return state.currentValue;
        },
        onSubscribe(
          this: NodeExecutionContext<LocationPathNodeState, LocationPathNodeData>,
          node: LocationPathNode,
        ): void {
          if (this.getData().disposeEventListener) return;
          const { history } = node.definition.properties;
          this.setData({
            disposeEventListener: node.scope.events.listen((event) => {
              if (event.type !== LOCATION_CHANGED) return;
              this.setState({
                currentValue: value(history.location.pathname),
              });
            }),
            disposeHistoryListener: history.listen((location) => {
              this.setState((state) => ({
                ...state,
                currentValue: value(location.pathname),
              }));
            }),
          });
        },
        onUnsubscribe(
          this: NodeExecutionContext<LocationPathNodeState, LocationPathNodeData>,
        ): void {
          const { disposeEventListener, disposeHistoryListener } = this.getData();
          disposeEventListener && disposeEventListener();
          disposeHistoryListener && disposeHistoryListener();
        },
      },
      set: {
        run(): NodeDefinition {
          return series([dispatch(LOCATION_PART_CHANGED), ok()]);
        },
        onSubscribe(
          this: NodeExecutionContext<LocationPathNodeState, LocationPathNodeData>,
          node: LocationPathNode,
          operation: SetOperation,
        ): void {
          const { history } = node.definition.properties;
          const pathValue = operation.properties.value.properties.value;
          getHistoryUpdater(history, node.definition.properties.update)({
            ...history.location,
            pathname: pathValue,
          });
          this.setState({
            currentValue: value(pathValue),
          });
        },
      },
    },
  },
);

export function locationPath(history: History, update?: boolean): NodeDefinition {
  return createNodeDefinition(LocationPathNodeType, {
    history,
    update,
  });
}

export function isLocationPathNodeDefinition(
  value: NodeDefinition,
): value is LocationPathNodeDefinition {
  return value.type === LocationPathNodeType;
}
