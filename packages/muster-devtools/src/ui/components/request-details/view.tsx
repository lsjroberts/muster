import {
  array,
  isArrayNodeDefinition,
  isErrorNodeDefinition,
  isPendingNodeDefinition,
  isQuerySetNodeDefinition,
  NodeDefinition,
  pending,
  querySetResult,
  QuoteNodeDefinition,
  serialize,
  SerializedContext,
  SerializedGraphNode,
  SerializedScope,
} from '@dws/muster';
import { MiddlewareRequestStatus, StoreMetadata } from '@dws/muster-devtools-client';
import classnames from 'classnames';
import * as React from 'react';
import { createDummyNode, createGraphParser, GraphTreeNode } from '../../../utils/parse-graph-tree';
import { formatMiddlewareStatus, formatTime } from '../../utils';
import createGraphHelpers from '../../utils/create-graph-helpers';
import formatBytes from '../../utils/format-bytes';
import memoizeLast from '../../utils/memoize-last';
import { GraphView } from '../graph-view';
import NODE_RENDERERS from '../graph-view/tree/node-renderers';
import OPERATION_RENDERERS from '../graph-view/tree/operation-renderers';

export type PartialStoreMetadata =
  | StoreMetadata
  | { [K in keyof StoreMetadata]: StoreMetadata[K] | null };

export interface RequestDetailsProps {
  store: PartialStoreMetadata | undefined;
  request: Request | NilRequest;
  responses: Array<Response>;
  selectedMiddlewareName: string | undefined;
  setSelectedMiddlewareName: (value: string | undefined) => void;
}

export interface Request {
  createTime: number;
  id: number;
  middlewareName: string;
  query: {
    scope: SerializedScope;
    context: SerializedContext;
    definition: QuoteNodeDefinition;
  };
  status: MiddlewareRequestStatus;
}

export interface NilRequest {
  createTime: null;
  id: null;
  middlewareName: null;
  query: {
    scope: null;
    context: null;
    definition: null;
  };
}

function isNilRequest(value: Request | NilRequest): value is NilRequest {
  return !value.query.definition;
}

export interface Response {
  createTime: number;
  response: {
    scope: SerializedScope;
    context: SerializedContext;
    definition: QuoteNodeDefinition;
  };
}

export interface RequestDetailsExternalProps {
  middlewareNames: Array<string>;
  proxyId: string;
  requestId: number;
}

export class RequestDetailsView extends React.PureComponent<
  RequestDetailsProps & RequestDetailsExternalProps
> {
  private getGraphParser = memoizeLast((store: StoreMetadata | undefined) =>
    store ? createGraphParser(store) : undefined,
  );
  private getRequestParser = memoizeLast(
    (parse: ((root: SerializedGraphNode) => GraphTreeNode) | undefined) =>
      parse
        ? memoizeLast(
            (request: Request): GraphTreeNode => {
              const { scope, context, definition } = request.query;
              const serializedRequest = createDummyNode(scope, context, definition.properties.node);
              return parse(serializedRequest);
            },
          )
        : undefined,
  );
  private getResponseParser = memoizeLast(
    (parse: ((root: SerializedGraphNode) => GraphTreeNode) | undefined) =>
      parse
        ? memoizeLast(
            (response: Response): GraphTreeNode => {
              const { scope, context, definition } = response.response;
              const serializedRequest = createDummyNode(scope, context, definition.properties.node);
              return parse(serializedRequest);
            },
          )
        : undefined,
  );
  private getCombinedRequestResponseParser = memoizeLast(
    (parse: ((root: SerializedGraphNode) => GraphTreeNode) | undefined) =>
      parse
        ? memoizeLast(
            ({ request, response }: { request: Request; response: Response }) => {
              const { scope, context } = request.query;
              const combinedQuery = getCombinedRequestResponse(request, response);
              const rootNode = combinedQuery || request.query.definition.properties.node;
              const serializedRequestResponse = createDummyNode(scope, context, rootNode);
              return parse(serializedRequestResponse);
            },
            (current, previous) =>
              current.request === previous.request && current.response === previous.response,
          )
        : undefined,
  );
  private getGraphHelpers = memoizeLast((store: StoreMetadata | undefined) =>
    createGraphHelpers(store, {
      nodes: NODE_RENDERERS,
      operations: OPERATION_RENDERERS,
      subscribe: () => () => {},
    }),
  );

  constructor(props: RequestDetailsProps & RequestDetailsExternalProps) {
    super(props);
    if (props.selectedMiddlewareName === undefined && props.middlewareNames.length > 0) {
      props.setSelectedMiddlewareName(props.middlewareNames[0]);
    }
  }

  render() {
    const { store, middlewareNames, request, responses, selectedMiddlewareName } = this.props;
    const storeMetadata = store && isValidNodeMetadata(store) ? store : undefined;
    const graphHelpers = this.getGraphHelpers(storeMetadata);
    // TODO: Get currently selected response
    const selectedResponse = responses[0];
    const { request: requestGraphRoots, response: responseGraphRoots } =
      storeMetadata && !isNilRequest(request)
        ? this.getPreviewGraphRoots(storeMetadata, request, selectedResponse)
        : { request: undefined, response: undefined };
    return (
      <React.Fragment>
        <div className="my-2">
          {middlewareNames.map((name, index) => (
            <span key={name}>
              {index > 0 ? <span className="mx-2">▶</span> : null}
              <button
                className={classnames('btn', {
                  'btn-primary': name === selectedMiddlewareName,
                  'btn-secondary': name !== selectedMiddlewareName,
                })}
                onClick={() => this.props.setSelectedMiddlewareName(name)}
                type="button"
              >
                {name}
              </button>
            </span>
          ))}
        </div>
        {selectedMiddlewareName && (
          <React.Fragment>
            <div className="my-2 row">
              <div className="col">
                <h2>Request</h2>
                <dl className="row">
                  <dt className="col-3">Request time</dt>
                  <dd className="col-9">
                    {request && !isNilRequest(request) && formatTime(request.createTime)}
                  </dd>

                  <dt className="col-3">Status</dt>
                  <dd className="col-9">
                    {request && !isNilRequest(request) && formatMiddlewareStatus(request.status)}
                  </dd>

                  <dt className="col-3">Size</dt>
                  <dd className="col-9">
                    {request && !isNilRequest(request) && getQuerySize(request.query.definition)}
                  </dd>
                </dl>
              </div>
              <div className="col">
                <h2>Response</h2>
                <dl className="row">
                  <dt className="col-3">Response time</dt>
                  <dd className="col-9">
                    {selectedResponse && formatTime(selectedResponse.createTime)}
                  </dd>

                  <dt className="col-3">Status</dt>
                  <dd className="col-9">
                    {selectedResponse &&
                      formatResponseStatus(selectedResponse.response.definition.properties.node)}
                  </dd>

                  <dt className="col-3">Size</dt>
                  <dd className="col-9">
                    {selectedResponse && getQuerySize(selectedResponse.response.definition)}
                  </dd>
                </dl>
              </div>
            </div>
            <h5>Content</h5>
            {selectedResponse && responseGraphRoots && responseGraphRoots.length > 0 ? (
              <div className="my-2 row">
                <div className="col">
                  {request && <GraphView roots={requestGraphRoots} helpers={graphHelpers} />}
                </div>
                <div className="col">
                  <GraphView roots={responseGraphRoots} helpers={graphHelpers} />
                </div>
              </div>
            ) : (
              <GraphView roots={requestGraphRoots} helpers={graphHelpers} />
            )}
          </React.Fragment>
        )}
      </React.Fragment>
    );
  }

  private getPreviewGraphRoots(
    store: StoreMetadata,
    request: Request,
    response: Response | undefined,
  ): { request: Array<GraphTreeNode> | undefined; response: Array<GraphTreeNode> | undefined } {
    if (request && response && getCombinedRequestResponse(request, response)) {
      return {
        request: this.getCombinedRequestResponseGraphRoots(store, request, response),
        response: undefined,
      };
    }
    return {
      request: this.getRequestGraphRoots(store, request),
      response: response && this.getResponseGraphRoots(store, response),
    };
  }

  private getCombinedRequestResponseGraphRoots(
    store: StoreMetadata,
    request: Request,
    response: Response,
  ): Array<GraphTreeNode> | undefined {
    const parseGraphTree = this.getGraphParser(store);
    const parseCombinedRequestResponseRoot = this.getCombinedRequestResponseParser(parseGraphTree);
    if (!parseCombinedRequestResponseRoot) {
      return undefined;
    }
    return [parseCombinedRequestResponseRoot({ request, response })];
  }

  private getRequestGraphRoots(
    store: StoreMetadata,
    request: Request | NilRequest,
  ): Array<GraphTreeNode> | undefined {
    if (isNilRequest(request)) {
      return [];
    }
    const parseGraphTree = this.getGraphParser(store);
    const parseRequestRoot = this.getRequestParser(parseGraphTree);
    if (!parseRequestRoot) {
      return undefined;
    }
    return [parseRequestRoot(request)];
  }

  private getResponseGraphRoots(
    store: StoreMetadata,
    response: Response,
  ): Array<GraphTreeNode> | undefined {
    const parseGraphTree = this.getGraphParser(store);
    const parseResponseRoot = this.getResponseParser(parseGraphTree);
    if (!parseResponseRoot) {
      return undefined;
    }
    return [parseResponseRoot(response)];
  }
}

function getCombinedRequestResponse(
  request: Request,
  response: Response,
): NodeDefinition | undefined {
  const {
    definition: {
      properties: { node: requestDefinition },
    },
  } = request.query;
  const {
    definition: {
      properties: { node: responseDefinition },
    },
  } = response.response;
  if (!isQuerySetNodeDefinition(requestDefinition)) {
    return undefined;
  }
  if (!isArrayNodeDefinition(responseDefinition)) {
    return undefined;
  }
  return querySetResult(
    requestDefinition.properties.children,
    isPendingNodeDefinition(responseDefinition)
      ? array(requestDefinition.properties.children.map(() => pending()))
      : responseDefinition,
  );
}

function getQuerySize(query: NodeDefinition): string {
  const queryString = serialize(query);
  const querySize = queryString.length * 2;
  const foundNodes = queryString.match(/"\$type":/g);
  const foundNodesCount = foundNodes ? foundNodes.length : 0;
  return `${foundNodesCount} nodes (${formatBytes(querySize)})`;
}

function isValidNodeMetadata(value: PartialStoreMetadata | undefined): value is StoreMetadata {
  return Boolean(
    value &&
      value.scope !== null &&
      value.context !== null &&
      value.cache !== null &&
      value.subscriptions !== null,
  );
}

function formatResponseStatus(response: NodeDefinition): string {
  return isErrorNodeDefinition(response) ? 'Error' : 'OK';
}
