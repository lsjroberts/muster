import muster, { error, ref, value } from '../..';
import { operation, runScenario } from '../../test';
import { withErrorPath } from '../graph/error';
import { startCase } from './start-case';

describe('startCase()', () => {
  runScenario({
    description: 'GIVEN a muster graph containing some nodes',
    graph: () =>
      muster({
        helloWorld: value('--Test string--'),
        number: value(51),
      }),
    operations: [
      operation({
        description: 'WHEN the subject of startCase is a string',
        input: startCase('_-Test string ->'),
        expected: value('Test String'),
      }),
      operation({
        description: 'WHEN the subject of startCase is a ref to a string',
        input: startCase(ref('helloWorld')),
        expected: value('Test String'),
      }),
      operation({
        description: 'WHEN the subject of startCase is a number',
        input: startCase(123),
        expected: withErrorPath(
          error(
            [
              `'start-case' node expected 'subject' to resolve to a string value() node.`,
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
        description: 'WHEN the subject of startCase is a ref to a number',
        input: startCase(ref('number')),
        expected: withErrorPath(
          error(
            [
              `'start-case' node expected 'subject' to resolve to a string value() node.`,
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
