import { default as muster, error, nil, ref, value } from '../..';
import { operation, runScenario } from '../../test';
import { withErrorPath } from '../graph/error';
import { startsWith } from './starts-with';

describe('startsWith', () => {
  runScenario({
    description: 'GIVEN a muster graph containing some string',
    graph: () =>
      muster({
        helloWorld: value('Hello world'),
        hello: value('Hello'),
        bob: value('bob'),
        number: value(123),
        nil: nil(),
      }),
    operations: [
      operation({
        description: 'AND startsWith is called with matching static strings',
        input: startsWith('Hel', 'Hello world'),
        expected: value(true),
      }),
      operation({
        description: 'AND startsWith is called with not matching static string',
        input: startsWith('Hle', 'Hello world'),
        expected: value(false),
      }),
      operation({
        description: 'AND startsWith is called with refs to matching strings',
        input: startsWith(ref('hello'), ref('helloWorld')),
        expected: value(true),
      }),
      operation({
        description: 'AND startsWith is called with refs to not matching strings',
        input: startsWith(ref('bob'), ref('helloWorld')),
        expected: value(false),
      }),
      operation({
        description: 'AND startsWith is called with a nil target',
        input: startsWith(ref('bob'), ref('nil')),
        expected: value(false),
      }),
      operation({
        description: 'AND startsWith is called with a nil to match',
        input: startsWith(ref('nil'), ref('helloWorld')),
        expected: withErrorPath(
          error(
            [
              `'starts-with' node expected 'pattern' to resolve to a string value() node.`,
              ' Expected:',
              '  value(string)',
              ' Received:',
              '  value(undefined)',
            ].join('\n'),
          ),
          { path: ['nil'] },
        ),
      }),
      operation({
        description: 'AND startsWith is called with a number to match',
        input: startsWith(ref('number'), ref('helloWorld')),
        expected: withErrorPath(
          error(
            [
              `'starts-with' node expected 'pattern' to resolve to a string value() node.`,
              ' Expected:',
              '  value(string)',
              ' Received:',
              '  value(123)',
            ].join('\n'),
          ),
          { path: ['number'] },
        ),
      }),
      operation({
        description: 'AND startsWith is called with number target',
        input: startsWith(ref('bob'), ref('number')),
        expected: withErrorPath(
          error(
            [
              `'starts-with' node expected 'subject' to resolve to a string value() node.`,
              ' Expected:',
              '  value(string)',
              ' Received:',
              '  value(123)',
            ].join('\n'),
          ),
          { path: ['number'] },
        ),
      }),
    ],
  });
});
