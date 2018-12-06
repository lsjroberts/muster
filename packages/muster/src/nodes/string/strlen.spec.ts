import { default as muster, error, nil, ref, value } from '../..';
import { operation, runScenario } from '../../test';
import { withErrorPath } from '../graph/error';
import { strlen } from './strlen';

describe('strlen', () => {
  runScenario({
    description: 'GIVEN a muster graph containing some string nodes',
    graph: () =>
      muster({
        foo: value('foo'),
        empty: value(''),
        number: value(3),
        missing: value(undefined),
        nothing: nil(),
      }),
    operations: [
      operation({
        description: 'AND strlen is called on a string',
        input: strlen(ref('foo')),
        expected: value(3),
      }),
      operation({
        description: 'AND strlen is called on an empty string',
        input: strlen(ref('empty')),
        expected: value(0),
      }),
      operation({
        description: 'AND strlen is called on a number',
        input: strlen(ref('number')),
        expected: withErrorPath(error('This value node does not support the length operation.'), {
          path: ['number'],
        }),
      }),
      operation({
        description: 'AND strlen is called on an undefined value',
        input: strlen(ref('missing')),
        expected: withErrorPath(error('This value node does not support the length operation.'), {
          path: ['missing'],
        }),
      }),
      operation({
        description: 'AND strlen is called on a nil node',
        input: strlen(ref('nothing')),
        expected: value(undefined),
      }),
    ],
  });
});
