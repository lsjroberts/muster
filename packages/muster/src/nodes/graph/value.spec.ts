import muster, { root } from '../..';
import { operation, runScenario } from '../../test';
import { value } from './value';

describe('value()', () => {
  describe('WHEN called with a value', () => {
    runScenario({
      description: 'GIVEN a graph with a value root node',
      graph: () => muster(value('foo')),
      operations: [
        operation({
          description: 'AND a request is made for the root node',
          input: root(),
          expected: value('foo'),
        }),
      ],
    });
  });
});
