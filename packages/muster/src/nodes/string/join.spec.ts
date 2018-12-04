import { default as muster, error, joinItems, nil, ref, value, withErrorPath } from '../..';
import { operation, runScenario } from '../../test';
import { join } from './join';

describe('join', () => {
  describe('Concatenating value(string)', () => {
    runScenario({
      description: '',
      graph: () =>
        muster({
          theQuick: value('The quick'),
        }),
      operations: [
        operation({
          description: 'AND join is called with no args',
          input: join(' '),
          expected: value(''),
        }),
        operation({
          description: 'AND join is called with a single string',
          input: join(' ', 'The quick'),
          expected: value('The quick'),
        }),
        operation({
          description: 'AND join is called with multiple strings',
          input: join(' ', 'The quick', 'brown', 'fox jumps', 'over the lazy dog'),
          expected: value('The quick brown fox jumps over the lazy dog'),
        }),
        operation({
          description: 'AND join is called with refs to the graph',
          input: join(' ', ref('theQuick'), 'brown', 'fox jumps', 'over the lazy dog'),
          expected: value('The quick brown fox jumps over the lazy dog'),
        }),
        operation({
          description: 'AND join is called with some nodes being nil',
          input: join(' ', 'Hello', nil(), 'world!'),
          expected: value('Hello world!'),
        }),
        operation({
          description: 'AND join is called with some nodes being numbers',
          input: join(' ', 'Hello', value(123), 'world!'),
          expected: withErrorPath(
            error(
              [
                `Join node operand resolved to an incorrect node.`,
                ' Expected:',
                '  value(string)',
                '  value(Array<string>)',
                ' Received:',
                '  value(123)',
              ].join('\n'),
            ),
            { path: [] },
          ),
        }),
      ],
    });

    runScenario({
      description: 'GIVEN a value node containing an array of strings',
      graph: () =>
        muster({
          names: value(['Bob', 'Jane', 'Kate']),
        }),
      operations: [
        operation({
          description: 'WHEN the join is called for names',
          input: join(' ', ref('names')),
          expected: value('Bob Jane Kate'),
        }),
      ],
    });
  });

  describe('Concatenating array(value(string))', () => {
    runScenario({
      description: 'GIVEN an empty array',
      graph: () =>
        muster({
          emptyArray: [],
        }),
      operations: [
        operation({
          description: 'WHEN calling join on an empty array',
          input: joinItems(' ', ref('emptyArray')),
          expected: value(''),
        }),
      ],
    });

    runScenario({
      description: 'GIVEN an array of value(string)',
      graph: () =>
        muster({
          names: ['Bob', 'Jane', 'Kate'],
        }),
      operations: [
        operation({
          description: 'WHEN calling join on an array of strings',
          input: joinItems(' ', ref('names')),
          expected: value('Bob Jane Kate'),
        }),
      ],
    });

    runScenario({
      description: 'GIVEN an array of numbers',
      graph: () =>
        muster({
          numbers: [1, 2, 3],
        }),
      operations: [
        operation({
          description: 'WHEN callingjoin on an array of numbers',
          input: joinItems(' ', ref('numbers')),
          expected: withErrorPath(
            error(
              [
                `Join node operand resolved to an incorrect node.`,
                ' Expected:',
                '  value(string)',
                '  value(Array<string>)',
                ' Received:',
                '  value([1, 2, 3])',
              ].join('\n'),
            ),
            { path: [] },
          ),
        }),
      ],
    });
  });
});
