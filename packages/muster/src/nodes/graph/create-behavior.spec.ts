import muster, { error, ErrorNodeDefinition, getInvalidTypeError, ref, set, value } from '../..';
import { operation, runScenario } from '../../test';
import { createBehavior } from './create-behavior';
import { withErrorPath } from './error';

function getTestError(
  failedOperation: string,
  acceptedOperations: Array<string>,
  nodePath: Array<string>,
): ErrorNodeDefinition {
  return withErrorPath(
    error(
      getInvalidTypeError(
        `This createBehavior node does not implement the '${failedOperation}' operation.`,
        {
          expected: acceptedOperations,
          received: failedOperation,
        },
      ),
    ),
    { path: nodePath },
  );
}

describe('createBehavior()', () => {
  runScenario({
    description: 'GIVEN a createBehavior node that does not implement any operations.',
    graph: () =>
      muster({
        node: createBehavior({}),
      }),
    operations: [
      operation({
        description: 'WHEN getting the value of the createBehavior node',
        input: ref('node'),
        expected: getTestError('evaluate', [], ['node']),
      }),
    ],
  });

  runScenario({
    description: 'GIVEN a createBehavior node that implements only evaluate operation',
    graph: () =>
      muster({
        node: createBehavior({
          evaluate: () => value('Hello world!'),
        }),
      }),
    operations: [
      operation({
        description: 'WHEN getting the value of the createBehavior node',
        input: ref('node'),
        expected: value('Hello world!'),
      }),
      operation({
        description: 'WHEN setting the value of the createBehavior node',
        input: set('node', 'other value'),
        expected: getTestError('set', ['evaluate'], ['node']),
      }),
    ],
  });
});
