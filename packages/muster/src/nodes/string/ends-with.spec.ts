import { default as muster, error, nil, ref, value } from '../..';
import { operation, runScenario } from '../../test';
import { withErrorPath } from '../graph/error';
import { endsWith } from './ends-with';

describe('endsWith', () => {
  runScenario({
    description: 'GIVEN a muster graph containing some string',
    graph: () =>
      muster({
        helloWorld: value('Hello world'),
        world: value('world'),
        bob: value('bob'),
        number: value(123),
        nil: nil(),
      }),
    operations: [
      operation({
        description: 'AND endsWith is called with matching static strings',
        input: endsWith('rld', 'Hello world'),
        expected: value(true),
      }),
      operation({
        description: 'AND endsWith is called with not matching static string',
        input: endsWith('wordl', 'Hello world'),
        expected: value(false),
      }),
      operation({
        description: 'AND endsWith is called with refs to matching strings',
        input: endsWith(ref('world'), ref('helloWorld')),
        expected: value(true),
      }),
      operation({
        description: 'AND endsWith is called with refs to not matching strings',
        input: endsWith(ref('bob'), ref('helloWorld')),
        expected: value(false),
      }),
      operation({
        description: 'AND endsWith is called with a nil target',
        input: endsWith(ref('bob'), ref('nil')),
        expected: value(false),
      }),
      operation({
        description: 'AND endsWith is called with a nil to match',
        input: endsWith(ref('nil'), ref('helloWorld')),
        expected: withErrorPath(
          error(
            [
              `'ends-with' node expected 'pattern' to resolve to a string value() node.`,
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
        description: 'AND endsWith is called with a number to match',
        input: endsWith(ref('number'), ref('helloWorld')),
        expected: withErrorPath(
          error(
            [
              `'ends-with' node expected 'pattern' to resolve to a string value() node.`,
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
        description: 'AND endsWith is called with number target',
        input: endsWith(ref('bob'), ref('number')),
        expected: withErrorPath(
          error(
            [
              `'ends-with' node expected 'subject' to resolve to a string value() node.`,
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
