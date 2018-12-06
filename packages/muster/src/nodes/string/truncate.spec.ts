import { default as muster, error, nil, ref, value } from '../..';
import { operation, runScenario } from '../../test';
import { withErrorPath } from '../graph/error';
import { truncate } from './truncate';

describe('truncate', () => {
  runScenario({
    description: 'GIVEN a muster graph',
    graph: () =>
      muster({
        someString: value('Fancy text message'),
        emptyString: value(''),
        ten: value(10),
        tenString: value('10'),
        nearlyTen: value(9.9),
        nil: nil(),
      }),
    operations: [
      operation({
        description: 'WHEN truncate is requested with a specified length 10',
        input: truncate(ref('someString'), ref('ten')),
        expected: value('Fancy tex…'),
      }),
      operation({
        description: 'WHEN truncate is requested with a custom omission',
        input: truncate(ref('someString'), ref('ten'), '<<<'),
        expected: value('Fancy t<<<'),
      }),
      operation({
        description: 'WHEN truncate is requested for a non numeric length',
        input: truncate(ref('someString'), ref('tenString')),
        expected: withErrorPath(
          error(
            [
              `'truncate' node expected 'length' to resolve to a positive integer value() node.`,
              ' Expected:',
              '  value()',
              ' Received:',
              '  value("10")',
            ].join('\n'),
          ),
          { path: ['tenString'] },
        ),
      }),
      operation({
        description: 'WHEN truncate is requested for a non integer length',
        input: truncate(ref('someString'), ref('nearlyTen')),
        expected: withErrorPath(
          error(
            [
              `'truncate' node expected 'length' to resolve to a positive integer value() node.`,
              ' Expected:',
              '  value()',
              ' Received:',
              '  value(9.9)',
            ].join('\n'),
          ),
          { path: ['nearlyTen'] },
        ),
      }),
      operation({
        description: 'WHEN truncate is requested for nil value node',
        input: truncate(ref('nil'), ref('ten')),
        expected: value(undefined),
      }),
      operation({
        description: 'WHEN truncate is requested for an empty string',
        input: truncate(ref('emptyString'), ref('ten')),
        expected: value(''),
      }),
    ],
  });
});
