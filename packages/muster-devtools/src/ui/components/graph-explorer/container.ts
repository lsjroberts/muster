import { container, global, ifElse, nil, propTypes, ref, types } from '@dws/muster-react';

export const GraphExplorerContainer = container({
  graph: ifElse({
    if: ref(global('selectedInstanceId')),
    then: {
      currentClient: ref(global('client', ref(global('selectedInstanceId')))),
      store: ref('currentClient', 'store'),
      subscribeNode: ref('currentClient', 'subscribePath'),
      unsubscribeNode: ref('currentClient', 'unsubscribePath'),
    },
    else: nil(),
  }),
  props: {
    subscribeNode: propTypes.caller(),
    unsubscribeNode: propTypes.caller(),
    store: {
      scope: types.string,
      context: types.string,
      cache: types.any,
      subscriptions: propTypes.list(),
      nodeTypes: types.any,
    },
  },
});
