import { default as muster, error, nil, ref, value } from '../..';
import { operation, runScenario } from '../../test';
import { withErrorPath } from '../graph/error';
import { charAt } from './char-at';

describe('charAt', () => {
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
        description: 'AND charAt is requested for 4',
        input: charAt(ref('four'), ref('someString')),
        expected: value('y'),
      }),
      operation({
        description: 'AND charAt is requested for 0',
        input: charAt(ref('zero'), ref('someString')),
        expected: value('F'),
      }),
      operation({
        description: 'AND char at is requested for 0 from empty string',
        input: charAt(ref('zero'), ref('emptyString')),
        expected: value(undefined),
      }),
      operation({
        description: 'AND charAt is requested for 0 from nil string',
        input: charAt(ref('zero'), ref('nil')),
        expected: value(undefined),
      }),
      operation({
        description: 'AND charAt is requested for 0 index from an integer',
        input: charAt(ref('zero'), ref('four')),
        expected: withErrorPath(
          error(
            [
              `'char-at' node expected 'subject' to resolve to a string value() node.`,
              ' Expected:',
              '  value(string)',
              ' Received:',
              '  value(4)',
            ].join('\n'),
          ),
          { path: ['four'] },
        ),
      }),
      operation({
        description: 'AND charAt is requested for -1',
        input: charAt(ref('minusOne'), ref('someString')),
        expected: withErrorPath(
          error(
            [
              `'char-at' node expected 'index' to resolve to a positive integer value() node.`,
              ' Expected:',
              '  value()',
              ' Received:',
              '  value(-1)',
            ].join('\n'),
          ),
          { path: ['minusOne'] },
        ),
      }),
      operation({
        description: 'AND charAt is requested for "4"',
        input: charAt(ref('fourString'), ref('someString')),
        expected: withErrorPath(
          error(
            [
              `'char-at' node expected 'index' to resolve to a positive integer value() node.`,
              ' Expected:',
              '  value()',
              ' Received:',
              '  value("4")',
            ].join('\n'),
          ),
          { path: ['fourString'] },
        ),
      }),
      operation({
        description: 'AND charAt is requested for 3.9',
        input: charAt(ref('nearlyFour'), ref('someString')),
        expected: withErrorPath(
          error(
            [
              `'char-at' node expected 'index' to resolve to a positive integer value() node.`,
              ' Expected:',
              '  value()',
              ' Received:',
              '  value(3.9)',
            ].join('\n'),
          ),
          { path: ['nearlyFour'] },
        ),
      }),
    ],
  });
});
