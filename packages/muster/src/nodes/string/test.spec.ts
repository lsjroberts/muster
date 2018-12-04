import { default as muster, error, nil, ref, regex, value } from '../..';
import { operation, runScenario } from '../../test';
import { withErrorPath } from '../graph/error';
import { test } from './test';

describe('test', () => {
  runScenario({
    description: 'GIVEN a muster graph',
    graph: () =>
      muster({
        nil: nil(),
        emptyString: value(''),
        someString: value('Fancy text message'),
        regex: regex(/t.*t/),
        ten: value(10),
        wrondRegex: regex(/z.*y/),
      }),
    operations: [
      operation({
        description: 'WHEN test is invoked with a matching regex',
        input: test(ref('regex'), ref('someString')),
        expected: value(true),
      }),
      operation({
        description: 'WHEN test is invoked with a non matching regex',
        input: test(ref('wrondRegex'), ref('someString')),
        expected: value(false),
      }),
      operation({
        description: 'WHEN test is requested for a nil string',
        input: test(ref('regex'), ref('nil')),
        expected: value(undefined),
      }),
      operation({
        description: 'WHEN match is requested for an empty string',
        input: test(ref('regex'), ref('emptyString')),
        expected: value(false),
      }),
      operation({
        description: 'WHEN match is invoked with non regex or string pattern',
        input: test(ref('ten'), ref('someString')),
        expected: withErrorPath(
          error(
            [
              `'test' node expected 'regex' to resolve to a regex node.`,
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
