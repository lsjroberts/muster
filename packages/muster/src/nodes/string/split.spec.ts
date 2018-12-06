import { array, default as muster, error, nil, ref, value } from '../..';
import { operation, runScenario } from '../../test';
import { withErrorPath } from '../graph/error';
import { split } from './split';

describe('split', () => {
  runScenario({
    description: 'GIVEN a muster graph containing strings',
    graph: () =>
      muster({
        nil: nil(),
        emptyString: value(''),
        someString: value('Fancy,text,message'),
        separator: value(','),
        num: value(10),
        noExistingseparator: value(';'),
      }),
    operations: [
      operation({
        description: 'WHEN split is called with a comma separator',
        input: split(ref('someString'), ref('separator')),
        expected: array([value('Fancy'), value('text'), value('message')]),
      }),
      operation({
        description: 'WHEN split is called with a non existing separator',
        input: split(ref('someString'), ref('noExistingseparator')),
        expected: array([value('Fancy,text,message')]),
      }),
      operation({
        description: 'WHEN split is called with a comma separator on an empty string',
        input: split(ref('emptyString'), ref('separator')),
        expected: array([value('')]),
      }),
      operation({
        description: 'WHEN split is called with a comma separator on an nil string',
        input: split(ref('nil'), ref('separator')),
        expected: value(undefined),
      }),
      operation({
        description: 'WHEN split is called with a comma separator and a fixed limit',
        input: split(ref('someString'), ref('separator'), 2),
        expected: array([value('Fancy'), value('text')]),
      }),
      operation({
        description: 'WHEN split is called with a non string separator',
        input: split(ref('someString'), ref('num')),
        expected: withErrorPath(
          error(
            [
              `'split' node expected 'separator' to resolve to a string value() node.`,
              ' Expected:',
              '  value(string)',
              ' Received:',
              '  value(10)',
            ].join('\n'),
          ),
          { path: ['num'] },
        ),
      }),
      operation({
        description: 'WHEN split is called with a string limit value',
        input: split(ref('someString'), ref('separator'), 'limit'),
        expected: withErrorPath(
          error(
            [
              `'split' node expected 'limit' to resolve to a positive integer value() node.`,
              ' Expected:',
              '  value()',
              ' Received:',
              '  value("limit")',
            ].join('\n'),
          ),
          { path: [] },
        ),
      }),
    ],
  });
});
