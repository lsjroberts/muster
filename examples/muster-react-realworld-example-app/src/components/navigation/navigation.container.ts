import {
  container,
  global,
  ref,
  types,
} from '@dws/muster-react';

export const NavigationContainer = container({
  graph: {
    currentPage: ref(global('navigation', 'currentPage')),
    isLoggedIn: ref(global('auth', 'isLoggedIn')),
    username: ref(global('api', 'user', 'username')),
  },
  props: {
    currentPage: types.string,
    isLoggedIn: types.bool,
    username: types.optional(types.string),
  },
  renderLoading: true,
});
