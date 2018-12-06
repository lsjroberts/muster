import { container, eq, global, not, ref, types } from '@dws/muster-react';

export const GraphContainer = container({
  graph: {
    isInstanceSelected: not(eq(ref(global('selectedInstanceId')), undefined)),
  },
  props: {
    isInstanceSelected: types.bool,
  },
});
