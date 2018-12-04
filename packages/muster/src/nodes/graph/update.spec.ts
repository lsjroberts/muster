import muster, { add, fn, ref, value, variable } from '../..';
import { operation, runScenario } from '../../test';
import { update } from './update';

describe('update', () => {
  describe('integration', () => {
    runScenario({
      description: 'GIVEN a variable node on a branch',
      graph: () =>
        muster({
          foo: variable(value(123)),
        }),
      operations: [
        operation({
          description: 'THEN adding 1',
          input: update('foo', fn((n) => add(n, value(1)))),
          operations: [
            operation({
              description: 'THEN resolving the value',
              input: ref('foo'),
              expected: value(124),
              operations: [
                operation({
                  description: 'THEN adding 2',
                  input: update('foo', fn((n) => add(n, value(2)))),
                  operations: [
                    operation({
                      description: 'THEN resolving the value',
                      input: ref('foo'),
                      expected: value(126),
                    }),
                  ],
                }),
              ],
            }),
          ],
        }),
      ],
    });
  });
});
