import muster, {
  apply,
  context,
  error,
  fn,
  format,
  get,
  match,
  param,
  query,
  ref,
  root,
  scope,
  types,
  value,
  withErrorPath,
} from '../..';
import { operation, runScenario } from '../../test';
import { withScope } from './with-scope';

describe('scope', () => {
  runScenario({
    description: 'GIVEN a graph that contains private data and sandboxed session-specific data',
    graph: () =>
      muster({
        public: {
          greet: fn((user) =>
            format('Hello, ${username}!', {
              username: get(user, 'username'),
            }),
          ),
        },
        users: {
          alice: { username: 'alice' },
          bob: { username: 'bob' },
        },
        sessionData: {
          'session:foo': {
            user: ref('users', 'alice'),
          },
          'session:bar': {
            user: ref('users', 'bob'),
          },
        },
        sessions: {
          [match(types.string, 'sessionId')]: scope(
            {
              title: apply([get(context('session'), 'user')], get(context('public'), 'greet')),
            },
            {
              public: ref('public'),
              session: ref('sessionData', param('sessionId')),
            },
          ),
        },
      }),
    operations: [
      operation({
        description: 'SHOULD sandbox queries to the scope root',
        input: withScope(
          ref('sessions', 'session:foo'),
          query(root(), {
            title: true,
          }),
        ),
        expected: value({
          title: 'Hello, alice!',
        }),
      }),
      operation({
        description: 'SHOULD sandbox arbitrary expressions to the scope context',
        input: withScope(
          ref('sessions', 'session:foo'),
          apply([get(context('session'), 'user')], get(context('public'), 'greet')),
        ),
        expected: value('Hello, alice!'),
      }),
      operation({
        description: 'SHOULD NOT allow access to the parent context',
        input: withScope(ref('sessions', 'session:foo'), param('sessionId')),
        expected: withErrorPath(error('Parameter not found: "sessionId"'), {
          path: ['sessions', 'session:foo'],
        }),
      }),
    ],
  });
});
