import { default as muster, error, nil, ref, value } from '../..';
import { operation, runScenario } from '../../test';
import { withErrorPath } from '../graph/error';
import { substring } from './substring';

describe('substring', () => {
  runScenario({
    description: 'GIVEN a muster graph containing strings and numbers',
    graph: () =>
      muster({
        nil: nil(),
        emptyString: value(''),
        someString: value('Fancy text message'),
        minusOne: value(-1),
        zero: value(0),
        four: value(4),
        fourString: value('4'),
        nearlyFour: value(3.9),
      }),
    operations: [
      operation({
        description: 'WHEN substring is requested for start index 4',
        input: substring(ref('someString'), ref('four')),
        expected: value('y text message'),
      }),
      operation({
        description: 'WHEN substring is requested for start index 0',
        input: substring(ref('someString'), ref('zero')),
        expected: value('Fancy text message'),
      }),
      operation({
        description: 'WHEN substring is requested for positive start index from empty string',
        input: substring(ref('emptyString'), ref('zero')),
        expected: value(''),
      }),
      operation({
        description: 'WHEN substring is requested for 0 start index from nil string',
        input: substring(ref('nil'), ref('zero')),
        expected: value(undefined),
      }),
      operation({
        description: 'WHEN substring is requested for 0 start index and 4 end index',
        input: substring(ref('someString'), ref('zero'), ref('four')),
        expected: value('Fanc'),
      }),
      operation({
        description: 'WHEN substring is requested for 4 start index and 0 end index',
        input: substring(ref('someString'), ref('zero'), ref('four')),
        expected: value('Fanc'),
      }),
      operation({
        description: 'WHEN substring is requested for 0 index from an integer',
        input: substring(ref('zero'), ref('four')),
        expected: withErrorPath(
          error(
            [
              `'substring' node expected 'subject' to resolve to a string value() node.`,
              ' Expected:',
              '  value(string)',
              ' Received:',
              '  value(0)',
            ].join('\n'),
          ),
          { path: ['zero'] },
        ),
      }),
      operation({
        description: 'WHEN substring is requested for 3.9',
        input: substring(ref('someString'), ref('nearlyFour')),
        expected: withErrorPath(
          error(
            [
              `'substring' node expected 'startIndex' to resolve to a positive integer value() node.`,
              ' Expected:',
              '  value()',
              ' Received:',
              '  value(3.9)',
            ].join('\n'),
          ),
          { path: ['nearlyFour'] },
        ),
      }),
      operation({
        description: 'WHEN charAt is requested for "4"',
        input: substring(ref('someString'), ref('fourString')),
        expected: withErrorPath(
          error(
            [
              `'substring' node expected 'startIndex' to resolve to a positive integer value() node.`,
              ' Expected:',
              '  value()',
              ' Received:',
              '  value("4")',
            ].join('\n'),
          ),
          { path: ['fourString'] },
        ),
      }),
    ],
  });
});
