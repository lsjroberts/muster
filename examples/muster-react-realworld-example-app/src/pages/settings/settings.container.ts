import {
  arrayList,
  call,
  clear,
  container,
  dispatch,
  ErrorNodeDefinition,
  fn,
  global,
  ifError,
  propTypes,
  push,
  ref,
  resetVariablesInScope,
  series,
  set,
  types,
  variable,
} from '@dws/muster-react';
import { editable } from '../../utils/editable';
import { getApiErrors } from '../../utils/get-api-errors';

export const SettingsContainer = container({
  graph: {
    ...editable(ref(global('api', 'user')), 'bio'),
    ...editable(ref(global('api', 'user')), 'email'),
    ...editable(ref(global('api', 'user')), 'image'),
    ...editable(ref(global('api', 'user')), 'username'),
    logout: fn(() => ifError(
      (error: ErrorNodeDefinition) => {
        const errors = getApiErrors(error);
        return series([
          clear(ref('errors')),
          ...errors.map((error) => push(ref('errors'), error))
        ]);
      },
      series([
        clear(ref('errors')),
        call(ref(global('api', 'logout'))),
        set(global('navigation', 'location'), { path: '/' })
      ]),
    )),
    password: variable(undefined),
    updateSettings: fn(() => ifError(
      (error: ErrorNodeDefinition) => {
        const errors = getApiErrors(error);
        return series([
          clear(ref('errors')),
          ...errors.map((error) => push(ref('errors'), error))
        ]);
      },
      series([
        clear(ref('errors')),
        call(ref(global('api', 'updateUser')), {
          bio: ref('bio'),
          email: ref('email'),
          image: ref('image'),
          username: ref('username'),
          password: ref('password'),
        }),
        dispatch(resetVariablesInScope()),
      ]),
    )),
    errors: arrayList([]),
  },
  props: {
    bio: types.optional(types.string),
    email: types.string,
    image: types.optional(types.string),
    username: types.string,
    password: types.optional(types.string),
    setBio: propTypes.setter('bio', types.string),
    setEmail: propTypes.setter('email', types.string),
    setImage: propTypes.setter('image', types.string),
    setUsername: propTypes.setter('username', types.string),
    setPassword: propTypes.setter('password', types.string),
    updateSettings: propTypes.caller(),
    errors: propTypes.list(),
    logout: propTypes.caller(),
  },
  renderLoading: true,
});
