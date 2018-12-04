import muster, {
  action,
  call,
  error,
  fn,
  format,
  getInvalidTypeError,
  ref,
  value,
  withErrorPath,
} from '../..';
import { operation, runScenario } from '../../test';
import { partial } from './partial';

describe('partial()', () => {
  runScenario({
    description: 'GIVEN an fn() and action() with named argument',
    graph: () =>
      muster({
        greetAction: action(({ name }) => `Hello, ${name}!`),
        greetFn: fn(['name'], ({ name }) => format('Hello, ${name}!', { name })),
        greetBobAction: partial(ref('greetAction'), { name: 'Bob' }),
        greetBobFn: partial(ref('greetFn'), { name: 'Bob' }),
      }),
    operations: [
      operation({
        description: 'WHEN calling the greetBobAction with no args',
        input: call('greetBobAction'),
        expected: value('Hello, Bob!'),
      }),
      operation({
        description: 'WHEN calling the greetBobFn with no args',
        input: call('greetBobFn'),
        expected: value('Hello, Bob!'),
      }),
      operation({
        description: 'WHEN calling the greetBobAction with additional args',
        input: call('greetBobAction', { other: 'value' }),
        expected: value('Hello, Bob!'),
      }),
      operation({
        description: 'WHEN calling the greetBobFn with additional args',
        input: call('greetBobFn', { other: 'value' }),
        expected: value('Hello, Bob!'),
      }),
      operation({
        description: 'WHEN calling the greetBobAction with name arg',
        input: call('greetBobAction', { name: 'Kate' }),
        expected: value('Hello, Bob!'),
      }),
      operation({
        description: 'WHEN calling the greetBobFn with name arg',
        input: call('greetBobFn', { name: 'Kate' }),
        expected: value('Hello, Bob!'),
      }),
      operation({
        description: 'WHEN calling the greetBobAction with positional arguments',
        input: call('greetBobAction', ['Bob']),
        expected: withErrorPath(
          error(
            getInvalidTypeError('A partial node was called with unexpected type of arguments.', {
              expected: 'Named arguments',
              received: 'Array of arguments',
            }),
          ),
          { path: ['greetBobAction'] },
        ),
      }),
      operation({
        description: 'WHEN calling the greetBobFn with positional arguments',
        input: call('greetBobFn', ['Bob']),
        expected: withErrorPath(
          error(
            getInvalidTypeError('A partial node was called with unexpected type of arguments.', {
              expected: 'Named arguments',
              received: 'Array of arguments',
            }),
          ),
          { path: ['greetBobFn'] },
        ),
      }),
    ],
  });

  runScenario({
    description: 'GIVEN an fn() and action() with positional arguments',
    graph: () =>
      muster({
        greetAction: action((name) => `Hello, ${name}!`),
        greetFn: fn((name) => format('Hello, ${name}!', { name })),
        greetBobAction: partial(ref('greetAction'), ['Bob']),
        greetBobFn: partial(ref('greetFn'), ['Bob']),
      }),
    operations: [
      operation({
        description: 'WHEN calling the greetBobAction with no args',
        input: call('greetBobAction'),
        expected: value('Hello, Bob!'),
      }),
      operation({
        description: 'WHEN calling the greetBobFn with no args',
        input: call('greetBobFn'),
        expected: value('Hello, Bob!'),
      }),
      operation({
        description: 'WHEN calling the greetBobAction with additional args',
        input: call('greetBobAction', ['other']),
        expected: value('Hello, Bob!'),
      }),
      operation({
        description: 'WHEN calling the greetBobFn with additional args',
        input: call('greetBobFn', ['other']),
        expected: value('Hello, Bob!'),
      }),
      operation({
        description: 'WHEN calling the greetBobAction with named arguments',
        input: call('greetBobAction', { name: 'Bob' }),
        expected: withErrorPath(
          error(
            getInvalidTypeError('A partial node was called with unexpected type of arguments.', {
              expected: 'Array of arguments',
              received: 'Named arguments',
            }),
          ),
          { path: ['greetBobAction'] },
        ),
      }),
      operation({
        description: 'WHEN calling the greetBobFn with positional arguments',
        input: call('greetBobFn', { name: 'Bob' }),
        expected: withErrorPath(
          error(
            getInvalidTypeError('A partial node was called with unexpected type of arguments.', {
              expected: 'Array of arguments',
              received: 'Named arguments',
            }),
          ),
          { path: ['greetBobFn'] },
        ),
      }),
    ],
  });
});
