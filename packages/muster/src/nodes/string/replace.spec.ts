import { default as muster, error, nil, ref, value } from '../..';
import { operation, runScenario } from '../../test';
import { withErrorPath } from '../graph/error';
import { replace } from './replace';

describe('replace', () => {
  runScenario({
    description: 'GIVEN a muster graph containing a some value nodes',
    graph: () =>
      muster({
        helloWorld: value('Hello world!'),
        world: value('world'),
        wordd: value('wordd'),
        bob: value('bob'),
        nil: nil(),
      }),
    operations: [
      operation({
        description: 'AND replace is called with matching string',
        input: replace(ref('world'), ref('bob'), ref('helloWorld')),
        expected: value('Hello bob!'),
      }),
      operation({
        description: 'AND replace is called with no matching string',
        input: replace(ref('wordd'), ref('bob'), ref('helloWorld')),
        expected: value('Hello world!'),
      }),
      operation({
        description: 'AND includes is called with a nil pattern',
        input: replace(ref('nil'), ref('world'), ref('helloWorld')),
        expected: withErrorPath(
          error(
            [
              `'replace' node expected 'pattern' to resolve to a string value() node.`,
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
        description: 'AND includes is called with a nil replace pattern',
        input: replace(ref('world'), ref('nil'), ref('helloWorld')),
        expected: withErrorPath(
          error(
            [
              `'replace' node expected 'replacePattern' to resolve to a string value() node.`,
              ' Expected:',
              '  value(string)',
              ' Received:',
              '  value(undefined)',
            ].join('\n'),
          ),
          { path: ['nil'] },
        ),
      }),
    ],
  });
});
