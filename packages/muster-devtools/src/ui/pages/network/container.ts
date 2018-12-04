import {
  container,
  eq,
  global,
  ifElse,
  nil,
  not,
  propTypes,
  ref,
  types,
  variable,
} from '@dws/muster-react';

export const NetworkContainer = container({
  graph: {
    isInstanceSelected: not(eq(ref(global('selectedInstanceId')), undefined)),
    proxies: ifElse({
      if: ref('isInstanceSelected'),
      then: ref(global('client', ref(global('selectedInstanceId')), 'network', 'proxies')),
      else: nil(),
    }),
    selectedProxyId: variable(undefined),
  },
  props: {
    isInstanceSelected: types.bool,
    proxies: propTypes.list({
      id: types.string,
      path: propTypes.list(),
    }),
    selectedProxyId: types.optional(types.string),
    setSelectedProxyId: propTypes.setter('selectedProxyId', types.optional(types.string)),
  },
});
