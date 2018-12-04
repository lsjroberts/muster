import { container, global, ref, types } from '@dws/muster-react';

export const PageContainerContainer = container({
  graph: ref(global('navigation', 'location')),
  props: {
    path: types.string,
  },
});
