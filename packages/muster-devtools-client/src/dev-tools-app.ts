import muster, {
  action,
  and,
  applyTransforms,
  array,
  arrayList,
  call,
  computed,
  count,
  createGraphNode,
  deserialize,
  DisposeCallback,
  eq,
  filter,
  FLUSH,
  fromStream,
  get,
  getMusterNodeTypesMap,
  getMusterOperationTypesMap,
  getPath,
  GraphOperation,
  gt,
  head,
  ifPending,
  match,
  Muster,
  NodeDefinition,
  param,
  ProxyNode,
  push,
  quote,
  ref,
  relative,
  resolveOperation,
  SerializedGraphOperation,
  set,
  setTransformMiddlewares,
  stream,
  toNode,
  tree,
  TreeNodeDefinition,
  types,
  value,
  variable,
} from '@dws/muster';
import { parseNodeDefinition } from '@dws/muster-parser';
import flatMap from 'lodash/flatMap';
import noop from 'lodash/noop';
import { MiddlewareRequestStatus } from '.';
import { getRequestDebuggerRequestId, requestDebuggerMiddleware } from './remote-middlewares';
import { pathToQuerySet } from './utils/path-to-query-set';

export function createDevToolsApp(app: Muster): Muster {
  const subscribedPaths: Array<{
    path: Array<SerializedGraphOperation>;
    unsubscribe: DisposeCallback;
  }> = [];
  const devToolsApp = muster({
    network: {
      proxies: arrayList([]),
      addProxy: action(function*(proxyId, path, middlewareNames) {
        const proxyExists = yield gt(
          head(
            applyTransforms(ref(relative('proxies')), [
              filter((proxy: NodeDefinition) => eq(get(proxy, 'id'), proxyId)),
              count(),
            ]),
          ),
          0,
        );
        if (proxyExists) return;
        yield push(
          ref(relative('proxies')),
          toNode({
            id: proxyId,
            middlewareNames,
            path: value(path),
            requests: arrayList([]),
          }),
        );
      }),
      addRequest: action(function*(proxyId, requestId, middlewareName, query) {
        yield push(
          get(
            head(
              applyTransforms(ref(relative('proxies')), [
                filter((item: NodeDefinition) => eq(get(item, 'id'), proxyId)),
              ]),
            ),
            'requests',
          ),
          toNode({
            createTime: new Date().getTime(),
            id: requestId,
            middlewareName,
            query,
            responses: arrayList([]),
            status: variable(MiddlewareRequestStatus.Pending),
          }),
        );
      }),
      addResponse: action(function*(proxyId, requestId, middlewareName, response) {
        const matchingProxyQuery = head(
          applyTransforms(ref(relative('proxies')), [
            filter((item: NodeDefinition) => eq(get(item, 'id'), proxyId)),
          ]),
        );
        const matchingRequestQuery = head(
          applyTransforms(get(matchingProxyQuery, 'requests'), [
            filter((item: NodeDefinition) =>
              and(eq(get(item, 'id'), requestId), eq(get(item, 'middlewareName'), middlewareName)),
            ),
          ]),
        );
        yield push(
          get(matchingRequestQuery, 'responses'),
          toNode({
            createTime: new Date().getTime(),
            response,
          }),
        );
        yield set(get(matchingRequestQuery, 'status'), MiddlewareRequestStatus.Open);
      }),
      closeRequest: action(function*(proxyId, requestId, middlewareName) {
        const matchingProxyQuery = head(
          applyTransforms(ref(relative('proxies')), [
            filter((item: NodeDefinition) => eq(get(item, 'id'), proxyId)),
          ]),
        );
        yield set(
          get(
            head(
              applyTransforms(get(matchingProxyQuery, 'requests'), [
                filter((item: NodeDefinition) =>
                  and(
                    eq(get(item, 'id'), requestId),
                    eq(get(item, 'middlewareName'), middlewareName),
                  ),
                ),
              ]),
            ),
            'status',
          ),
          MiddlewareRequestStatus.Closed,
        );
      }),
    },
    watch: {
      [match(types.string, 'query')]: computed([param('query')], (query) => {
        const parsedQuery = parseNodeDefinition(query);
        const queryStream = app.resolve(parsedQuery, { raw: true });
        return fromStream(queryStream);
      }),
    },
    store: ifPending(
      () => createStoreTree(app),
      fromStream(
        stream.toObservable(
          stream.map(
            () => createStoreTree(app),
            stream.filter(
              (event) => event.type === FLUSH,
              stream.fromEmitter(app.scope.globalEvents),
            ),
          ),
        ),
      ),
    ),
    subscribePath: action((path: Array<SerializedGraphOperation>) => {
      const deserializedPath: Array<GraphOperation> = path.map((part) =>
        deserialize(getMusterNodeTypesMap(), getMusterOperationTypesMap(), part),
      );
      const queryNode = pathToQuerySet(deserializedPath);
      const unsubscribe = app.scope.store.subscribe(
        createGraphNode(app.scope, app.context, queryNode),
        resolveOperation(),
        noop,
      );
      subscribedPaths.push({ path, unsubscribe });
    }),
    unsubscribePath: action((path: Array<SerializedGraphOperation>) => {
      const foundSubscriptionIndex = subscribedPaths.findIndex((item) => {
        return (
          item.path.length === path.length &&
          item.path.every((part, partIndex) => part.id === path[partIndex].id)
        );
      });
      if (foundSubscriptionIndex === -1) return;
      subscribedPaths[foundSubscriptionIndex].unsubscribe();
      subscribedPaths.splice(foundSubscriptionIndex, 1);
    }),
  });
  setTransformMiddlewares(
    (middlewares: Array<NodeDefinition>, proxyNode: ProxyNode): Array<NodeDefinition> => {
      const proxyId = proxyNode.id;
      devToolsApp
        .resolve(
          call(ref('network', 'addProxy'), [
            proxyId,
            getPath(proxyNode.context),
            middlewares.map((middleware) => middleware.type.name),
          ]),
        )
        .then();
      return flatMap(middlewares, (middleware) => {
        const middlewareName = middleware.type.name;
        return [
          requestDebuggerMiddleware({
            onRequest: async (query, metadata) => {
              const requestId = getRequestDebuggerRequestId(metadata);
              if (!requestId) {
                console.error('Request debugger received a request with no request id.');
                return;
              }
              await devToolsApp.resolve(
                call(ref('network', 'addRequest'), [
                  proxyId,
                  requestId,
                  middlewareName,
                  toNode({
                    id: query.id,
                    scope: query.scope.id,
                    context: query.context.id,
                    definition: quote(query.definition),
                  }),
                ]),
              );
            },
            onRequestClosed: async (metadata) => {
              const requestId = getRequestDebuggerRequestId(metadata);
              if (!requestId) {
                console.error('Request debugger received a request with no request id.');
                return;
              }
              await devToolsApp.resolve(
                call(ref('network', 'closeRequest'), [proxyId, requestId, middlewareName]),
              );
            },
            onResponse: async (response, metadata) => {
              const requestId = getRequestDebuggerRequestId(metadata);
              if (!requestId) {
                console.error('Request debugger received a request with no request id.');
                return;
              }
              await devToolsApp.resolve(
                call(ref('network', 'addResponse'), [
                  proxyId,
                  requestId,
                  middlewareName,
                  toNode({
                    id: response.id,
                    scope: response.scope.id,
                    context: response.context.id,
                    definition: quote(response.definition),
                  }),
                ]),
              );
            },
          }),
          middleware,
        ];
      });
    },
  );
  return devToolsApp;
}

function createStoreTree(app: Muster): TreeNodeDefinition {
  const { cache, nodeTypes, subscriptions } = app.scope.store.inspect();
  return tree({
    scope: value(app.scope.id),
    context: value(app.context.id),
    cache: value(cache),
    subscriptions: array(subscriptions),
    nodeTypes: value(nodeTypes),
  });
}
