import muster, { error, ref, value } from '../..';
import { operation, runScenario } from '../../test';
import { withErrorPath } from '../graph/error';
import { upperCase } from './upper-case';

describe('upperCase()', () => {
  runScenario({
    description: 'GIVEN a muster graph containing some nodes',
    graph: () =>
      muster({
        helloWorld: value('Hello world'),
        number: value(51),
      }),
    operations: [
      operation({
        description: 'WHEN the subject of upperCase is a string',
        input: upperCase('Test String'),
        expected: value('TEST STRING'),
      }),
      operation({
        description: 'WHEN the subject of upperCase is a ref to a string',
        input: upperCase(ref('helloWorld')),
        expected: value('HELLO WORLD'),
      }),
      operation({
        description: 'WHEN the subject of upperCase is a number',
        input: upperCase(123),
        expected: withErrorPath(
          error(
            [
              `'upper-case' node expected 'subject' to resolve to a string value() node.`,
              ' Expected:',
              '  value(string)',
              ' Received:',
              '  value(123)',
            ].join('\n'),
          ),
          { path: [] },
        ),
      }),
      operation({
        description: 'WHEN the subject of upperCase is a ref to a number',
        input: upperCase(ref('number')),
        expected: withErrorPath(
          error(
            [
              `'upper-case' node expected 'subject' to resolve to a string value() node.`,
              ' Expected:',
              '  value(string)',
              ' Received:',
              '  value(51)',
            ].join('\n'),
          ),
          { path: ['number'] },
        ),
      }),
    ],
  });
});
