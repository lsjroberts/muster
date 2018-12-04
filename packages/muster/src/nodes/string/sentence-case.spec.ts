import { default as muster, error, nil, ref, value } from '../..';
import { operation, runScenario } from '../../test';
import { withErrorPath } from '../graph/error';
import { sentenceCase } from './sentence-case';

describe('sentence-case', () => {
  runScenario({
    description: 'GIVEN a muster graph',
    graph: () =>
      muster({
        nil: nil(),
        emptyString: value(''),
        someString: value('hello world'),
        num: value(10),
      }),
    operations: [
      operation({
        description: 'WHEN sentence-case is called with a sting value',
        input: sentenceCase(ref('someString')),
        expected: value('Hello world'),
      }),
      operation({
        description: 'WHEN sentence-case is called with a nil string',
        input: sentenceCase(ref('nil')),
        expected: value(undefined),
      }),
      operation({
        description: 'WHEN sentence-case is called with an empty string',
        input: sentenceCase(ref('emptyString')),
        expected: value(''),
      }),
      operation({
        description: 'WHEN sentence-case is called with a non string value',
        input: sentenceCase(ref('num')),
        expected: withErrorPath(
          error(
            [
              `'sentence-case' node expected 'subject' to resolve to a string value() node.`,
              ' Expected:',
              '  value(string)',
              ' Received:',
              '  value(10)',
            ].join('\n'),
          ),
          { path: ['num'] },
        ),
      }),
    ],
  });
});
