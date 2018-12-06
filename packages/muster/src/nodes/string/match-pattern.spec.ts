import { array, default as muster, error, nil, ref, regex, value } from '../..';
import { operation, runScenario } from '../../test';
import { withErrorPath } from '../graph/error';
import { matchPattern } from './match-pattern';

describe('matchPattern', () => {
  runScenario({
    description: 'GIVEN a muster graph',
    graph: () =>
      muster({
        nil: nil(),
        emptyString: value(''),
        someString: value('Fancy text message'),
        regex: regex(/t.*t/),
        ten: value(10),
        wrongRegex: regex(/z.*y/),
      }),
    operations: [
      operation({
        description: 'WHEN matchPattern is invoked with a matching regex',
        input: matchPattern(ref('regex'), ref('someString')),
        expected: array([value('text')]),
      }),
      operation({
        description: 'WHEN matchPattern is invoked with a non matching regex',
        input: matchPattern(ref('wrongRegex'), ref('someString')),
        expected: value(undefined),
      }),
      operation({
        description: 'WHEN matchPattern is requested for a nil string',
        input: matchPattern(ref('regex'), ref('nil')),
        expected: value(undefined),
      }),
      operation({
        description: 'WHEN matchPattern is requested for an empty string',
        input: matchPattern(ref('regex'), ref('emptyString')),
        expected: value(undefined),
      }),
      operation({
        description: 'WHEN matchPattern is invoked with non regex or string pattern',
        input: matchPattern(ref('ten'), ref('someString')),
        expected: withErrorPath(
          error(
            [
              `'match-pattern' node expected 'regex' to resolve to a regex node.`,
              ' Expected:',
              '  regex()',
              ' Received:',
              '  value(10)',
            ].join('\n'),
          ),
          { path: ['ten'] },
        ),
      }),
    ],
  });
});
