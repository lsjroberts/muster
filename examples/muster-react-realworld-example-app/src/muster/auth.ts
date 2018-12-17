import {
  createModule,
  eq,
  fromPromise,
  get,
  ifElse,
  nil,
  not,
  ok,
  ref,
  value,
} from '@dws/muster';

export const auth = createModule(
  { user: true },
  ({ user }) => ({
    isLoggedIn: ifElse({
      if: not(eq(ref('jwtToken'), undefined)),
      then: not(eq(get(user, 'token'), nil())),
      else: value(false),
    }),
    jwtToken: fromPromise({
      get: () => Promise.resolve(localStorage.getItem('jwt')),
      set: (params, value) => {
        localStorage.setItem('jwt', value);
        return Promise.resolve(ok());
      },
    }),
  })
);
