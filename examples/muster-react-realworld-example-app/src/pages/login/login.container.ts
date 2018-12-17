import {
  arrayList,
  call,
  clear,
  container,
  ErrorNodeDefinition,
  fn,
  global,
  ifError,
  propTypes,
  push,
  ref,
  series,
  set,
  types,
  variable,
} from '@dws/muster-react';
import { getApiErrors } from '../../utils/get-api-errors';

export const LoginContainer = container({
  graph: {
    email: variable(''),
    password: variable(''),
    login: fn(() => ifError(
      (error: ErrorNodeDefinition) => {
        const errors = getApiErrors(error);
        return series([
          clear(ref('errors')),
          ...errors.map((error) => push(ref('errors'), error))
        ]);
      },
      series([
        clear(ref('errors')),
        call(ref(global('api', 'login')), {
          email: ref('email'),
          password: ref('password'),
        }),
        set(ref(global('navigation', 'location', 'path')), '/'),
      ])
    )),
    errors: arrayList([]),
  },
  props: {
    email: types.string,
    password: types.string,
    setEmail: propTypes.setter('email', types.string),
    setPassword: propTypes.setter('password', types.string),
    login: propTypes.caller(),
    errors: propTypes.list(),
  },
});
