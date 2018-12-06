import sum from 'lodash/sum';
import muster, { computed, error, pending, ref, value } from '../..';
import { operation, runScenario } from '../../test';
import { injectDependencies } from './inject-dependencies';

describe('injectDependencies', () => {
  runScenario({
    description: 'GIVEN a muster graph containing some values',
    graph: () =>
      muster({
        four: value(4),
        five: value(5),
      }),
    operations: [
      operation({
        description: 'WHEN evaluating a value with provided dependencies',
        input: injectDependencies(value('Test value'), [], []),
        expected: value('Test value'),
      }),
      operation({
        description: 'WHEN evaluating a computed node with no provided dependencies',
        input: injectDependencies(
          computed([ref('four'), ref('five')], (...args: Array<any>) => sum(args)),
          [],
        ),
        expected: value(9),
      }),
      operation({
        description: 'WHEN evaluating a computed with first dependency provided',
        input: injectDependencies(
          computed([ref('four'), ref('five')], (...args: Array<any>) => sum(args)),
          [value(1)],
        ),
        expected: value(6),
      }),
      operation({
        description: 'WHEN evaluating a computed with second dependency provided',
        input: injectDependencies(
          computed([ref('four'), ref('five')], (...args: Array<any>) => sum(args)),
          [undefined, value(-1)],
        ),
        expected: value(3),
      }),
      operation({
        description: 'WHEN evaluating a computed with second dependency provided',
        input: injectDependencies(
          computed([ref('four'), ref('five')], (...args: Array<any>) => sum(args)),
          [value(6), value(7)],
        ),
        expected: value(13),
      }),
      operation({
        description: 'WHEN evaluating a computed with pending dependency getting substituted',
        input: injectDependencies(computed([pending()], (val: any) => val), [
          value('Non pending value'),
        ]),
        expected: value('Non pending value'),
      }),
      operation({
        description: 'WHEN evaluating a computed with error dependency getting substituted',
        input: injectDependencies(computed([error('boom!')], (val: any) => val), [
          value('Non error value'),
        ]),
        expected: value('Non error value'),
      }),
    ],
  });
});
