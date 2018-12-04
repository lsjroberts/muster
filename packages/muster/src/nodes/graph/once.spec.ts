import muster, { ref, set, value, variable } from '../..';
import { operation, runScenario } from '../../test';
import { once } from './once';

describe('once()', () => {
  runScenario({
    description: 'GIVEN an empty muster graph',
    operations: [
      operation({
        description: 'AND a once node wrapping a static value is resolved',
        input: once(value('foo')),
        expected: value('foo'),
      }),
    ],
  });

  runScenario({
    description: 'GIVEN a muster graph containing a variable',
    graph: () =>
      muster({
        name: variable('initial'),
      }),
    operations: [
      operation({
        description: 'WHEN the name gets requested once',
        input: once(ref('name')),
        expected: value('initial'),
        operations: (subscriber) => [
          operation({
            before() {
              jest.clearAllMocks();
            },
            description: 'AND the name gets set to a new value',
            input: set('name', 'updated'),
            expected: value('updated'),
            assert() {
              expect(subscriber().next).toHaveBeenCalledTimes(0);
            },
          }),
        ],
      }),
    ],
  });
});
