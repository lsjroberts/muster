import { default as muster, error, nil, ref, value } from '../..';
import { operation, runScenario } from '../../test';
import { withErrorPath } from '../graph/error';
import { parseInt as parseInteger } from './parse-int';

describe('parseInt', () => {
  runScenario({
    description: 'GIVEN a muster graph containing strings',
    graph: () =>
      muster({
        nil: nil(),
        someString: value('Fancy text message'),
        minusOne: value(-1),
        fourString: value('4'),
      }),
    operations: [
      operation({
        description: 'WHEN parseInt is requested for 4',
        input: parseInteger(ref('fourString'), 10),
        expected: value(4),
      }),
      operation({
        description: 'WHEN parseInt is invoked with no radix',
        input: parseInteger(ref('fourString')),
        expected: value(4),
      }),
      operation({
        description: 'WHEN parseInt is invoked with no radix',
        input: parseInteger(ref('fourString'), undefined),
        expected: value(4),
      }),
      operation({
        description: 'WHEN parseInt is requested for a radix that is not in the range 2-36',
        input: parseInteger(ref('fourString'), 1),
        expected: value(NaN),
      }),
      operation({
        description: 'WHEN parseInt is requested for a non numeric string',
        input: parseInteger(ref('someString'), 10),
        expected: value(NaN),
      }),
      operation({
        description: 'WHEN parseInt is requested for nil node',
        input: parseInteger(ref('nil'), 10),
        expected: value(undefined),
      }),
      operation({
        description: 'WHEN parseInt is requested for 4 using and negative radix',
        input: parseInteger(ref('fourString'), ref('minusOne')),
        expected: withErrorPath(
          error(
            [
              `'parse-int' node expected 'radix' to resolve to a positive integer value() node.`,
              ' Expected:',
              '  value()',
              ' Received:',
              '  value(-1)',
            ].join('\n'),
          ),
          { path: ['minusOne'] },
        ),
      }),
    ],
  });
});
