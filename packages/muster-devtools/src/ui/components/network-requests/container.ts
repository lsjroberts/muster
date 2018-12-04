import {
  applyTransforms,
  container,
  eq,
  filter,
  get,
  global,
  groupBy,
  head,
  map,
  NodeDefinition,
  prop,
  propTypes,
  ref,
  types,
  variable,
} from '@dws/muster-react';

export const NetworkRequestsContainer = container({
  graph: {
    middlewareNames: ref('proxy', 'middlewareNames'),
    proxy: head(
      applyTransforms(
        ref(global('client', ref(global('selectedInstanceId')), 'network', 'proxies')),
        [filter((proxy: NodeDefinition) => eq(get(proxy, 'id'), prop('proxyId')))],
      ),
    ),
    requests: applyTransforms(ref('proxy', 'requests'), [
      groupBy((item: NodeDefinition) => get(item, 'id')),
      map((item: NodeDefinition) => head(item)),
    ]),
    selectedRequestId: variable(undefined),
  },
  props: {
    middlewareNames: propTypes.list(),
    requests: propTypes.list({
      createTime: types.number,
      id: types.number,
      middlewareName: types.string,
      status: types.any,
    }),
    selectedRequestId: types.optional(types.number),
    setSelectedRequestId: propTypes.setter('selectedRequestId', types.optional(types.number)),
  },
});
