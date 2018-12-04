import {
  and,
  applyTransforms,
  container,
  eq,
  filter,
  get,
  global,
  graphTypes,
  head,
  ifElse,
  nil,
  NodeDefinition,
  prop,
  propTypes,
  ref,
  types,
  variable,
} from '@dws/muster-react';

export const RequestDetailsContainer = container({
  graph: {
    store: ifElse({
      if: ref(global('selectedInstanceId')),
      then: ref(global('client', ref(global('selectedInstanceId')), 'store')),
      else: nil(),
    }),
    proxy: head(
      applyTransforms(
        ref(global('client', ref(global('selectedInstanceId')), 'network', 'proxies')),
        [filter((proxy: NodeDefinition) => eq(get(proxy, 'id'), prop('proxyId')))],
      ),
    ),
    request: ifElse({
      if: ref('selectedMiddlewareName'),
      then: head(
        applyTransforms(ref('proxy', 'requests'), [
          filter((request: NodeDefinition) =>
            and(
              eq(get(request, 'id'), prop('requestId')),
              eq(get(request, 'middlewareName'), ref('selectedMiddlewareName')),
            ),
          ),
        ]),
      ),
      else: nil(),
    }),
    responses: ref('request', 'responses'),
    selectedMiddlewareName: variable(undefined),
  },
  props: {
    store: {
      scope: types.string,
      context: types.string,
      cache: types.any,
      subscriptions: propTypes.list(),
    },
    request: {
      createTime: types.number,
      id: types.number,
      middlewareName: types.string,
      query: {
        scope: types.any,
        context: types.any,
        definition: graphTypes.nodeDefinition,
      },
      status: types.any,
    },
    responses: propTypes.list({
      createTime: types.number,
      response: {
        scope: types.any,
        context: types.any,
        definition: graphTypes.nodeDefinition,
      },
    }),
    selectedMiddlewareName: types.optional(types.string),
    setSelectedMiddlewareName: propTypes.setter(
      'selectedMiddlewareName',
      types.optional(types.string),
    ),
  },
});
