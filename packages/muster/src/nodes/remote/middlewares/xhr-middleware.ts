import { map } from '@dws/muster-observable';
import {
  GraphNode,
  isNodeDefinition,
  NodeDefinition,
  NodeTypeMap,
  OperationTypeMap,
  StatelessGraphNode,
  StatelessNodeDefinition,
  StatelessNodeType,
} from '../../../types/graph';
import createNodeDefinition from '../../../utils/create-node-definition';
import { createNodeType } from '../../../utils/create-node-type';
import { deserialize } from '../../../utils/deserialize';
import { getInvalidTypeError } from '../../../utils/get-invalid-type-error';
import getType from '../../../utils/get-type';
import * as graphTypes from '../../../utils/graph-types';
import { sanitize } from '../../../utils/serialize';
import * as types from '../../../utils/types';
import { getMusterOperationTypesMap } from '../../../utils/types-registry';
import withScopeFrom from '../../../utils/with-scope-from';
import { error, ErrorNodeDefinition, isErrorNodeDefinition } from '../../graph/error';
import { fromStream } from '../../graph/from-stream';
import { resolve } from '../../graph/resolve';
import { isValueNodeDefinition } from '../../graph/value';
import { attachMetadata } from '../../migrations/attach-metadata';
import { toGraphWithMetadata } from '../../migrations/to-graph-with-metadata';
import { upgradeGraph } from '../../migrations/upgrade-graph';
import { RequestOperation } from '../operations/request';
import { doHttpRequest } from '../utils/do-http-request';

export interface XhrMiddlewareNode
  extends StatelessGraphNode<'xhr-middleware', XhrMiddlewareNodeProperties> {}

export interface XhrMiddlewareNodeDefinition
  extends StatelessNodeDefinition<'xhr-middleware', XhrMiddlewareNodeProperties> {}

export interface XhrMiddlewareNodeProperties {
  headers: NodeDefinition | undefined;
  log: boolean;
  nodeTypes: NodeTypeMap;
  numberOfRetries: number;
  operationTypes: OperationTypeMap;
  requestTimeout: number;
  retryDelay: number;
  url: string;
  withCredentials: boolean;
}

export const XhrMiddlewareNodeType: StatelessNodeType<
  'xhr-middleware',
  XhrMiddlewareNodeProperties
> = createNodeType('xhr-middleware', {
  shape: {
    headers: types.optional(graphTypes.nodeDefinition),
    log: types.bool,
    nodeTypes: types.saveHash(types.any),
    numberOfRetries: types.number,
    operationTypes: types.saveHash(types.any),
    requestTimeout: types.number,
    retryDelay: types.number,
    url: types.string,
    withCredentials: types.bool,
  },
  operations: {
    request: {
      run(node: XhrMiddlewareNode, operation: RequestOperation): NodeDefinition | GraphNode {
        const { query } = operation.properties;
        const options = node.definition.properties;
        const processRequest = (headersNode?: NodeDefinition): GraphNode => {
          if (options.log) {
            console.log(`Request [${operation.id}] headers:`, getType(headersNode));
          }
          const headersObject = {
            Accept: 'application/json, text/plain, */*',
            'Content-Type': 'application/json',
            ...(getCustomHeaders(headersNode) || {}),
          };
          const requestStream = doHttpRequest({
            body: JSON.stringify(attachMetadata(sanitize(query))),
            headers: headersObject,
            numberOfRetries: options.numberOfRetries,
            retryDelay: options.retryDelay,
            requestTimeout: options.requestTimeout,
            url: options.url,
            withCredentials: options.withCredentials,
          });
          const responseStream = map(
            (response) => deserializeResponse(options.nodeTypes, options.operationTypes, response),
            requestStream,
          );
          return withScopeFrom(node, fromStream(responseStream));
        };
        if (!options.headers) return processRequest();
        return resolve([{ target: options.headers, once: true }], ([resolvedHeaders]) =>
          processRequest(resolvedHeaders.definition),
        );
      },
    },
  },
});

export interface XhrMiddlewareOptions {
  headers?: NodeDefinition;
  log?: boolean;
  nodeTypes?: NodeTypeMap;
  numberOfRetries?: number;
  operationTypes?: OperationTypeMap;
  requestTimeout?: number;
  retryDelay?: number;
  url: string;
  withCredentials?: boolean;
}

export function xhrMiddleware(options: XhrMiddlewareOptions): XhrMiddlewareNodeDefinition {
  return createNodeDefinition(XhrMiddlewareNodeType, {
    headers: options.headers,
    log: options.log || false,
    nodeTypes: options.nodeTypes || getMusterNodeTypesMap(),
    numberOfRetries: options.numberOfRetries || 0,
    operationTypes: options.operationTypes || getMusterOperationTypesMap(),
    requestTimeout: options.requestTimeout || 30000,
    retryDelay: options.retryDelay || 0,
    url: options.url,
    withCredentials: options.withCredentials || false,
  });
}

// The node types must be imported after all export statements to avoid circular dependency errors
// tslint:disable-next-line
import { getMusterNodeTypesMap } from '../../../utils/types-registry';

function getCustomHeaders(headers: NodeDefinition | undefined): any {
  if (!headers) return undefined;
  if (!isValueNodeDefinition(headers)) {
    throw getInvalidTypeError('Headers have resolved to an incorrect node.', {
      expected: ['ValueNode'],
      received: headers,
    });
  }
  return headers.properties.value;
}

function deserializeResponse(
  nodeTypes: NodeTypeMap,
  operationTypes: OperationTypeMap,
  response: string | ErrorNodeDefinition,
): NodeDefinition {
  if (isNodeDefinition(response) && isErrorNodeDefinition(response)) return response;
  // 1. Try parsing response as JSON. Return error if that fails
  let parsedResponse: any;
  try {
    parsedResponse = JSON.parse(response);
  } catch (ex) {
    return error(ex);
  }
  // 2. Convert the parsed response to graphWithMetadata
  const graphWithMetadata = toGraphWithMetadata(parsedResponse);
  // 3. Upgrade the response to the latest version
  const upgradedGraphWithMetadata = upgradeGraph(graphWithMetadata);
  // 4. Deserialize the response
  return deserialize(nodeTypes, operationTypes, upgradedGraphWithMetadata.graph);
}
