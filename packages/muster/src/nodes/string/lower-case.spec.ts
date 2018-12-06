import muster, { error, ref, value } from '../..';
import { operation, runScenario } from '../../test';
import { withErrorPath } from '../graph/error';
import { lowerCase } from './lower-case';

describe('lowerCase()', () => {
  runScenario({
    description: 'GIVEN a muster graph containing some nodes',
    graph: () =>
      muster({
        helloWorld: value('Hello world'),
        number: value(51),
      }),
    operations: [
      operation({
        description: 'WHEN the subject of lowerCase is a string',
        input: lowerCase('Test String'),
        expected: value('test string'),
      }),
      operation({
        description: 'WHEN the subject of lowerCase is a ref to a string',
        input: lowerCase(ref('helloWorld')),
        expected: value('hello world'),
      }),
      operation({
        description: 'WHEN the subject of lowerCase is a number',
        input: lowerCase(123),
        expected: withErrorPath(
          error(
            [
              `'lower-case' node expected 'subject' to resolve to a string value() node.`,
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
        description: 'WHEN the subject of lowerCase is a ref to a number',
        input: lowerCase(ref('number')),
        expected: withErrorPath(
          error(
            [
              `'lower-case' node expected 'subject' to resolve to a string value() node.`,
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
