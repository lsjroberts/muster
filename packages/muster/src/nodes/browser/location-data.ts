import { History, Location } from 'history';
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
import { error } from '../graph/error';
import { ok } from '../graph/ok';
import { series } from '../graph/series';
import { value } from '../graph/value';
import {
  getHistoryUpdater,
  LOCATION_CHANGED,
  LOCATION_PART_CHANGED,
  LocationParamsEncoder,
  paramsFromSearch,
  paramsToSearch,
} from './location-common';

export interface LocationDataNode
  extends StatefulGraphNode<
      'locationData',
      LocationDataNodeProperties,
      LocationDataNodeState,
      LocationDataNodeData
    > {}

export interface LocationDataNodeDefinition
  extends NodeDefinition<
      'locationData',
      LocationDataNodeProperties,
      LocationDataNodeState,
      LocationDataNodeData
    > {}

export interface LocationDataNodeProperties {
  history: History;
  paramsEncoder: LocationParamsEncoder;
  update: boolean | undefined;
}

export interface LocationDataNodeState {
  currentValue: NodeDefinition;
}

export interface LocationDataNodeData {
  disposeEventListener: () => void;
  disposeHistoryListener: () => void;
}

export const LocationDataNodeType: StatefulNodeType<
  'locationData',
  LocationDataNodeProperties,
  LocationDataNodeState
> = createNodeType<'locationData', LocationDataNodeProperties, LocationDataNodeState>(
  'locationData',
  {
    state: {
      currentValue: graphTypes.nodeDefinition,
    },
    shape: {
      history: types.shape({
        id: types.string,
      }),
      paramsEncoder: types.optional(
        types.shape({
          encode: types.saveHash(types.func),
          decode: types.saveHash(types.func),
        }),
      ),
      update: types.optional(types.bool),
    },
    getInitialState(properties: LocationDataNodeProperties): LocationDataNodeState {
      return {
        currentValue: computeCurrentValue(properties.history.location, properties.paramsEncoder),
      };
    },
    operations: {
      evaluate: {
        run(
          node: LocationDataNode,
          options: never,
          dependencies: Array<never>,
          context: Array<never>,
          state: LocationDataNodeState,
        ): NodeDefinition {
          return state.currentValue;
        },
        onSubscribe(
          this: NodeExecutionContext<LocationDataNodeState, LocationDataNodeData>,
          node: LocationDataNode,
        ): void {
          if (this.getData().disposeEventListener) return;
          const { history, paramsEncoder } = node.definition.properties;
          this.setData({
            disposeEventListener: node.scope.events.listen((event) => {
              if (event.type !== LOCATION_CHANGED) return;
              this.setState({
                currentValue: computeCurrentValue(history.location, paramsEncoder),
              });
            }),
            disposeHistoryListener: history.listen((location) => {
              this.setState({
                currentValue: computeCurrentValue(location, paramsEncoder),
              });
            }),
          });
        },
        onUnsubscribe(
          this: NodeExecutionContext<LocationDataNodeState, LocationDataNodeData>,
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
          this: NodeExecutionContext<LocationDataNodeState, LocationDataNodeData>,
          node: LocationDataNode,
          operation: SetOperation,
        ): void {
          const { history } = node.definition.properties;
          const paramsValue = operation.properties.value.properties.value;
          getHistoryUpdater(history, node.definition.properties.update)({
            ...history.location,
            search: paramsToSearch(paramsValue, node.definition.properties.paramsEncoder),
          });
          this.setState({
            currentValue: value(paramsValue),
          });
        },
      },
    },
  },
);

export function locationData(
  history: History,
  encoder: LocationParamsEncoder,
  update?: boolean,
): NodeDefinition {
  return createNodeDefinition(LocationDataNodeType, {
    history,
    paramsEncoder: encoder,
    update,
  });
}

export function isLocationDataNodeDefinition(
  value: NodeDefinition,
): value is LocationDataNodeDefinition {
  return value.type === LocationDataNodeType;
}

function computeCurrentValue(location: Location, encoder: LocationParamsEncoder): NodeDefinition {
  try {
    return value(paramsFromSearch(location.search, encoder));
  } catch (ex) {
    return error(ex);
  }
}
