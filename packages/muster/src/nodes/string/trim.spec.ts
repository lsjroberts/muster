import muster, { error, ref, value } from '../..';
import { operation, runScenario } from '../../test';
import { withErrorPath } from '../graph/error';
import { trim } from './trim';

describe('trim()', () => {
  runScenario({
    description: 'GIVEN a muster graph containing some nodes',
    graph: () =>
      muster({
        helloWorld: value('  Hello world  '),
        number: value(51),
      }),
    operations: [
      operation({
        description: 'WHEN the subject of trim is a string',
        input: trim('  Test String   '),
        expected: value('Test String'),
      }),
      operation({
        description: 'WHEN the subject of trim is a ref to a string',
        input: trim(ref('helloWorld')),
        expected: value('Hello world'),
      }),
      operation({
        description: 'WHEN the subject of trim is a number',
        input: trim(123),
        expected: withErrorPath(
          error(
            [
              `'trim' node expected 'subject' to resolve to a string value() node.`,
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
        description: 'WHEN the subject of trim is a ref to a number',
        input: trim(ref('number')),
        expected: withErrorPath(
          error(
            [
              `'trim' node expected 'subject' to resolve to a string value() node.`,
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
