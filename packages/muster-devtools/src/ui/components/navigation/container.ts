import { container, global, propTypes, ref, types } from '@dws/muster-react';

export const NavigationContainer = container({
  graph: {
    path: ref(global('navigation', 'location', 'path')),
    instancesIds: ref(global('instancesIds')),
    selectedInstanceId: ref(global('selectedInstanceId')),
  },
  props: {
    path: types.string,
    instancesIds: propTypes.list(),
    selectInstance: propTypes.setter('selectedInstanceId', types.optional(types.string)),
    selectedInstanceId: types.optional(types.string),
  },
});
