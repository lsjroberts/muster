import muster, { root, value } from '../..';
import { operation, runScenario } from '../../test';
import { fn } from './fn';

describe('fn', () => {
  runScenario({
    description: 'GIVEN a fn node',
    graph: () => muster(fn(() => value(123))),
    operations: [
      operation({
        description: 'SHOULD resolve to the fn node',
        input: root(),
        expected: fn(() => value(123)),
      }),
    ],
  });
});
