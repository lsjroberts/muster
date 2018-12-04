import { createBrowserHistory, createHashHistory, HashType, History, Location } from 'history';
import identity from 'lodash/identity';
import uniqueId from 'lodash/uniqueId';
import { GetChildOperation } from '../../operations/get-child';
import { SetOperation } from '../../operations/set';
import {
  GraphNode,
  NodeDefinition,
  NodeExecutionContext,
  StatefulGraphNode,
  StatefulNodeType,
} from '../../types/graph';
import createGraphNode from '../../utils/create-graph-node';
import createNodeDefinition from '../../utils/create-node-definition';
import { createNodeType } from '../../utils/create-node-type';
import { getInvalidTypeErrorMessage } from '../../utils/get-invalid-type-error';
import * as graphTypes from '../../utils/graph-types';
import * as types from '../../utils/types';
import { dispatch } from '../graph/dispatch';
import { error } from '../graph/error';
import { createChildPathContext } from '../graph/get';
import { nil } from '../graph/nil';
import { ok } from '../graph/ok';
import { series } from '../graph/series';
import { value } from '../graph/value';
import {
  getHistoryUpdater,
  LOCATION_CHANGED,
  LOCATION_PART_CHANGED,
  LocationParamsEncoder,
  locationToLocationValue,
  paramsToSearch,
} from './location-common';
import { locationData } from './location-data';
import { locationPath } from './location-path';

export { LocationParamsEncoder } from './location-common';

/**
 * An instance of the [[location]] node.
 * See the [[location]] documentation to find out more.
 */
export interface LocationNode
  extends StatefulGraphNode<
      'location',
      LocationNodeProperties,
      LocationNodeState,
      LocationNodeData
    > {}

/**
 * A definition of the [[location]] node.
 * See the [[location]] documentation to find out more.
 */
export interface LocationNodeDefinition
  extends NodeDefinition<'location', LocationNodeProperties, LocationNodeState, LocationNodeData> {}

export interface LocationNodeProperties {
  hash: HashType | undefined;
  paramsEncoder: LocationParamsEncoder;
  update: boolean | undefined;
}

export type HistoryWithId = History & { id: string };

export interface LocationNodeState {
  currentValue: NodeDefinition;
  history: HistoryWithId;
}

export interface LocationNodeData {
  unsubscribeEvent: (() => void) | undefined;
  unsubscribeHistory: (() => void) | undefined;
}

/**
 * The implementation of the [[location]] node.
 * See the [[location]] documentation to learn more.
 */
export const LocationNodeType: StatefulNodeType<
  'location',
  LocationNodeProperties,
  LocationNodeState
> = createNodeType<'location', LocationNodeProperties, LocationNodeState>('location', {
  state: {
    currentValue: graphTypes.nodeDefinition,
    history: types.shape({
      id: types.string,
    }),
  },
  shape: {
    hash: types.optional(types.string),
    paramsEncoder: types.optional(
      types.shape({
        encode: types.saveHash(types.func),
        decode: types.saveHash(types.func),
      }),
    ),
    update: types.optional(types.bool),
  },
  getInitialState(properties: LocationNodeProperties): LocationNodeState {
    const history = (properties.hash
      ? createHashHistory({ hashType: properties.hash })
      : createBrowserHistory()) as HistoryWithId;
    history.id = uniqueId('history_');
    return {
      currentValue: computeCurrentValue(history.location, properties.paramsEncoder),
      history,
    };
  },
  operations: {
    evaluate: {
      run(
        node: LocationNode,
        options: never,
        dependencies: Array<never>,
        context: Array<never>,
        state: LocationNodeState,
      ): NodeDefinition {
        return state.currentValue;
      },
      onSubscribe(
        this: NodeExecutionContext<LocationNodeState, LocationNodeData>,
        node: LocationNode,
      ): void {
        if (this.getData().unsubscribeHistory) return;
        const { history } = this.getState();
        const { paramsEncoder } = node.definition.properties;
        this.setData({
          unsubscribeEvent: node.scope.events.listen((event) => {
            if (event.type !== LOCATION_PART_CHANGED) return;
            this.setState((state) => ({
              ...state,
              currentValue: computeCurrentValue(history.location, paramsEncoder),
            }));
          }),
          unsubscribeHistory: history.listen((location) => {
            this.setState((state) => ({
              ...state,
              currentValue: computeCurrentValue(location, paramsEncoder),
            }));
          }),
        });
      },
      onUnsubscribe(this: NodeExecutionContext<LocationNodeState, LocationNodeData>): void {
        const { unsubscribeEvent, unsubscribeHistory } = this.getData();
        unsubscribeEvent && unsubscribeEvent();
        unsubscribeHistory && unsubscribeHistory();
      },
    },
    getChild: {
      run(
        node: LocationNode,
        operation: GetChildOperation,
        dependencies: Array<never>,
        context: Array<never>,
        state: LocationNodeState,
      ): NodeDefinition | GraphNode {
        const { key } = operation.properties;
        const { history } = state;
        const childContext = createChildPathContext(node, key);
        if (key === 'path') {
          return createGraphNode(node.scope, childContext, locationPath(history));
        }
        if (key === 'params') {
          const { paramsEncoder, update } = node.definition.properties;
          return createGraphNode(
            node.scope,
            childContext,
            locationData(history, paramsEncoder, update),
          );
        }
        return nil();
      },
    },
    set: {
      run(
        node: LocationNode,
        options: never,
        dependencies: Array<never>,
        context: Array<never>,
        state: LocationNodeState,
      ): NodeDefinition {
        return series([dispatch(LOCATION_CHANGED), ok()]);
      },
      onSubscribe(
        this: NodeExecutionContext<LocationNodeState, LocationNodeData>,
        node: LocationNode,
        operation: SetOperation,
      ): void {
        const { history } = this.getState();
        const value = operation.properties.value.properties.value;
        const { paramsEncoder } = node.definition.properties;
        getHistoryUpdater(history, node.definition.properties.update)({
          pathname: value.path,
          search: paramsToSearch(value.params, paramsEncoder),
        });
        this.setState((state) => ({
          ...state,
          currentValue: computeCurrentValue(history.location, paramsEncoder),
        }));
      },
    },
  },
});

export type LocationParamsEncoding = 'base64' | 'json';

export interface LocationOptions {
  encoding?: LocationParamsEncoding | LocationParamsEncoder;
  hash?: HashType;
  update?: boolean;
}

const base64Encoder: LocationParamsEncoder = {
  encode: (value) => btoa(JSON.stringify(value)),
  decode: (value) => JSON.parse(atob(value)),
};

const jsonEncoder: LocationParamsEncoder = {
  encode: JSON.stringify,
  decode: JSON.parse,
};

const identityEncoder: LocationParamsEncoder = {
  encode: identity,
  decode: identity,
};

/**
 * Creates a new instance of a [[location]] node, which is a type of a [[NodeDefinition]] used when accessing browser location.
 * This node allows for reading/writing to the address bar, and can be used to implement custom routing mechanism.
 * The path can be encoded using following formats:
 *   - slash: #/home
 *   - noslash: #home
 *   - hashbang: #!/home
 *
 * Additionally, the node allows storing parameters both as URL encoded values, and as JSON serialized objects.
 * @returns {LocationNodeDefinition}
 *
 *
 * @example **Get current location**
 * ```js
 * import muster, { location, ref } from '@dws/muster';
 *
 * const app = muster({
 *   navigation: location(),
 * });
 *
 * // Given a URL: #/
 * await app.resolve(ref('navigation'));
 * // === { path: '/', params: {} }
 *
 * // Given a URL: #/home?showWelcome=true
 * await app.resolve(ref('navigation'));
 * // === { path: '/home', params: { showWelcome: 'true' } }
 * ```
 * This example shows how to get current path with parameters as a combined object.
 *
 *
 * @example **Set current location**
 * ```js
 * import muster, { location, ref, set } from '@dws/muster';
 *
 * const app = muster({
 *   navigation: location(),
 * });
 *
 * // Given a URL: #/home
 * await app.resolve(set(ref('navigation'), { path: '/user', params: { id: 10 } }));
 * // URL after set: #/user?id=10
 * ```
 * This example shows how to set the current location to a new value.
 *
 *
 * @example **Get current path**
 * ```js
 * import muster, { location, ref } from '@dws/muster';
 *
 * const app = muster({
 *   navigation: location(),
 * });
 *
 * // Given a URL: #/home?test=value
 * await app.resolve(ref('navigation', 'path'));
 * // === '/home'
 * ```
 * This example shows how to get only the path part of the URL. Internally the 'path' is handled by the
 * [[locationPath]] node.
 *
 *
 * @example **Set current path**
 * ```js
 * import muster, { location, ref, set } from '@dws/muster';
 *
 * const app = muster({
 *   navigation: location(),
 * });
 *
 * // Given a URL: #/home?id=12
 * await app.resolve(set(ref('navigation', 'path'), '/user'));
 * // URL after set: #/user?id=12
 * ```
 * This example shows how to set only the path without overwriting path params. Internally the 'params' is handled
 * by the [[locationPath]] node.
 *
 *
 * @example **Get current params**
 * ```js
 * import muster, { location, ref } from '@dws/muster';
 *
 * const app = muster({
 *   navigation: location(),
 * });
 *
 * // Given a URL: #/home?id=12
 * await app.resolve(ref('navigation', 'params'));
 * // === { id: '12' }
 * ```
 * This example shows how to get the current path parameters. Internally the 'params' is handled by the
 * [[locationData]] node.
 *
 *
 * @example **Set current params**
 * ```js
 * import muster, { location, ref, set } from '@dws/muster';
 *
 * const app = muster({
 *   navigation: location(),
 * });
 *
 * // Given a URL: #/home?id=12
 * await app.resolve(set(ref('navigation', 'params'), { test: 'value' }));
 * // URL after set: #/home?test=value
 * ```
 * This example shows how to set the path parameters without overwriting the path. Internally the 'params' is handled
 * by the [[locationData]] node.
 */
export function location(options: LocationOptions = {}): NodeDefinition {
  return createNodeDefinition(LocationNodeType, {
    hash: options.hash,
    paramsEncoder: getParamEncoder(options),
    update: options.update,
  });
}

function getParamEncoder(options: LocationOptions): LocationParamsEncoder {
  if (!options.encoding) return identityEncoder;
  if (typeof options.encoding === 'string') {
    switch (options.encoding) {
      case 'base64':
        return base64Encoder;
      case 'json':
        return jsonEncoder;
      default:
        throw getInvalidTypeErrorMessage('Invalid type of location encoder.', {
          expected: ['base64', 'json'],
          received: options.encoding,
        });
    }
  }
  return options.encoding;
}

export function isLocationNodeDefinition(value: NodeDefinition): value is LocationNodeDefinition {
  return value.type === LocationNodeType;
}

function computeCurrentValue(location: Location, encoder: LocationParamsEncoder): NodeDefinition {
  try {
    return value(locationToLocationValue(location, encoder));
  } catch (ex) {
    return error(ex);
  }
}
