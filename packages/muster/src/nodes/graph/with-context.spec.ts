import muster, { computed, context, ref, value } from '../..';
import { operation, runScenario } from '../../test';
import { withContext } from './with-context';

describe('withContext', () => {
  describe('Check if the context value is accessible', () => {
    runScenario({
      description: 'GIVEN a graph containing a withContext node',
      graph: () =>
        muster({
          inner: withContext(
            {
              name: value('Bob'),
            },
            {
              greeting: computed([context('name')], (name) => `Hello, ${name}`),
            },
          ),
        }),
      operations: [
        operation({
          description: 'WHEN the greeting gets requested',
          input: ref('inner', 'greeting'),
          expected: value('Hello, Bob'),
        }),
      ],
    });
  });

  describe('Check if the nodes within the `withContext` have access to root scope', () => {
    runScenario({
      description: 'GIVEN a graph containing a withContext node',
      graph: () =>
        muster({
          name: 'Bob',
          inner: withContext(
            {},
            {
              greeting: computed([ref('name')], (name) => `Hello, ${name}`),
            },
          ),
        }),
      operations: [
        operation({
          description: 'When the greeting gets requested',
          input: ref('inner', 'greeting'),
          expected: value('Hello, Bob'),
        }),
      ],
    });
  });
});
