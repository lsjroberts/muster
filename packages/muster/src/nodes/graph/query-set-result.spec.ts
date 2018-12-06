import muster, {
  array,
  get,
  querySetGetChildOperation,
  querySetOperation,
  resolveOperation,
  value,
} from '../..';
import { operation, runScenario } from '../../test';
import { querySetResult } from './query-set-result';

describe('querySetResult()', () => {
  runScenario({
    description: 'GIVEN a querySetResult with a value',
    graph: () => muster({}),
    operations: [
      operation({
        description: 'WHEN resolving the querySetResult',
        input: querySetResult(
          [querySetOperation(resolveOperation())],
          array([value('Hello world')]),
        ),
        expected: value('Hello world'),
      }),
    ],
  });

  runScenario({
    description: 'GIVEN a querySetResult with a branch',
    graph: () => muster({}),
    operations: [
      operation({
        description: 'WHEN resolving get(`name`) against the querySetResult',
        input: get(
          querySetResult(
            [querySetGetChildOperation('name', [querySetOperation(resolveOperation())])],
            array([
              // Operations
              array([value('Bob')]), // getChild('name')[resolve]
            ]),
          ),
          'name',
        ),
        expected: value('Bob'),
      }),
    ],
  });
});
