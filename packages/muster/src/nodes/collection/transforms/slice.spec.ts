import muster, { applyTransforms, entries, iterate, query, ref, value } from '../../..';
import { operation, runScenario } from '../../../test';
import { slice } from './slice';

describe('slice()', () => {
  describe('Using getItems operation', () => {
    runScenario({
      description: 'GIVEN a collection of numbers sliced using offset + length',
      graph: () =>
        muster({
          numbers: [1, 2, 3, 4, 5, 6],
          slicedNumbers: applyTransforms(ref('numbers'), [slice({ offset: 1, length: 3 })]),
        }),
      operations: [
        operation({
          description: 'WHEN getting a list of filtered numbers',
          input: query(ref('slicedNumbers'), entries()),
          expected: value([2, 3, 4]),
        }),
      ],
    });

    runScenario({
      description: 'GIVEN a collection of numbers sliced using from + to',
      graph: () =>
        muster({
          numbers: [1, 2, 3, 4, 5, 6],
          slicedNumbers: applyTransforms(ref('numbers'), [slice({ from: 2, to: 5 })]),
        }),
      operations: [
        operation({
          description: 'WHEN getting a list of filtered numbers',
          input: query(ref('slicedNumbers'), entries()),
          expected: value([3, 4, 5, 6]),
        }),
      ],
    });

    runScenario({
      description: 'GIVEN a collection of numbers sliced using begin + end',
      graph: () =>
        muster({
          numbers: [1, 2, 3, 4, 5, 6],
          slicedNumbers: applyTransforms(ref('numbers'), [slice({ begin: 2, end: 5 })]),
        }),
      operations: [
        operation({
          description: 'WHEN getting a list of filtered numbers',
          input: query(ref('slicedNumbers'), entries()),
          expected: value([3, 4, 5]),
        }),
      ],
    });
  });

  describe('Using iterators', () => {
    runScenario({
      description: 'GIVEN a collection of numbers sliced using offset + length',
      graph: () =>
        muster({
          numbers: [1, 2, 3, 4, 5, 6],
          slicedNumbers: iterate(ref('numbers'), [slice({ offset: 1, length: 3 })]),
        }),
      operations: [
        operation({
          description: 'WHEN getting a list of filtered numbers',
          input: query(ref('slicedNumbers'), entries()),
          expected: value([2, 3, 4]),
        }),
      ],
    });

    runScenario({
      description: 'GIVEN a collection of numbers sliced using from + to',
      graph: () =>
        muster({
          numbers: [1, 2, 3, 4, 5, 6],
          slicedNumbers: iterate(ref('numbers'), [slice({ from: 2, to: 5 })]),
        }),
      operations: [
        operation({
          description: 'WHEN getting a list of filtered numbers',
          input: query(ref('slicedNumbers'), entries()),
          expected: value([3, 4, 5, 6]),
        }),
      ],
    });

    runScenario({
      description: 'GIVEN a collection of numbers sliced using begin + end',
      graph: () =>
        muster({
          numbers: [1, 2, 3, 4, 5, 6],
          slicedNumbers: iterate(ref('numbers'), [slice({ begin: 2, end: 5 })]),
        }),
      operations: [
        operation({
          description: 'WHEN getting a list of filtered numbers',
          input: query(ref('slicedNumbers'), entries()),
          expected: value([3, 4, 5]),
        }),
      ],
    });
  });
});
