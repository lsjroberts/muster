import { container, ContainerComponentFactory, global, propTypes, ref } from '@dws/muster-react';

export const AppContainer: ContainerComponentFactory = container({
  graph: {
    title: ref(global('ui', 'title')),
  },
  props: {
    title: propTypes.string,
  },
});
