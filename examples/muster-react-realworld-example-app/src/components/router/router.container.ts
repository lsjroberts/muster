import { container, global, ref, types } from '@dws/muster-react';

export const RouterContainer = container({
  graph: {
    currentPage: ref(global('navigation', 'currentPage')),
    isLoggedIn: ref(global('auth', 'isLoggedIn')),
  },
  props: {
    currentPage: types.string,
    isLoggedIn: types.bool,
  },
});
