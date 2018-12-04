import { default as muster, error, nil, ref, value } from '../..';
import { operation, runScenario } from '../../test';
import { withErrorPath } from '../graph/error';
import { includes } from './includes';

describe('includes', () => {
  runScenario({
    description: 'GIVEN a muster graph containing a some value nodes',
    graph: () =>
      muster({
        helloWorld: value('Hello world!'),
        world: value('world'),
        misspelledWorld: value('wordl'),
        bob: value('bob'),
        number: value(123),
        nil: nil(),
      }),
    operations: [
      operation({
        description: 'AND includes is called with matching string',
        input: includes(ref('world'), ref('helloWorld')),
        expected: value(true),
      }),
      operation({
        description: 'AND includes is called with not matching string',
        input: includes(ref('bob'), ref('helloWorld')),
        expected: value(false),
      }),
      operation({
        description: 'AND includes is called with a misspelled string',
        input: includes(ref('misspelledWorld'), ref('helloWorld')),
        expected: value(false),
      }),
      operation({
        description: 'AND includes is called with a nil target',
        input: includes(ref('world'), ref('nil')),
        expected: value(false),
      }),
      operation({
        description: 'AND includes is called with a number target',
        input: includes(ref('world'), ref('number')),
        expected: withErrorPath(
          error(
            [
              `'includes' node expected 'subject' to resolve to a string value() node.`,
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
        description: 'AND includes is called with a nil as a string to match',
        input: includes(ref('nil'), ref('helloWorld')),
        expected: withErrorPath(
          error(
            [
              `'includes' node expected 'pattern' to resolve to a string value() node.`,
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
        description: 'AND includes is called with a number as a string to match',
        input: includes(ref('number'), ref('helloWorld')),
        expected: withErrorPath(
          error(
            [
              `'includes' node expected 'pattern' to resolve to a string value() node.`,
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
