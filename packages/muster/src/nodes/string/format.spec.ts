import muster, { array, computed, error, getType, isErrorNodeDefinition, ref, value } from '../..';
import { operation, runScenario } from '../../test';
import { withErrorPath } from '../graph/error';
import { format } from './format';

describe('format()', () => {
  runScenario({
    description: 'GIVEN a muster graph',
    graph: () =>
      muster({
        firstName: 'John',
        lastName: 'Doe',
        error: error('test error'),
        someAction: array([]),
      }),
    operations: [
      operation({
        description: 'WHEN template is requested with no data',
        input: format('Hello world', {}),
        expected: value('Hello world'),
      }),
      operation({
        description: 'WHEN template has a single string to replace',
        input: format('Welcome, ${firstName}', {
          firstName: 'John',
        }),
        expected: value('Welcome, John'),
      }),
      operation({
        description: 'WHEN template data is referenced from the graph',
        input: format('Welcome, ${fullName}', {
          fullName: computed(
            [ref('firstName'), ref('lastName')],
            (firstName: string, lastName: string) => `${firstName} ${lastName}`,
          ),
        }),
        expected: value('Welcome, John Doe'),
      }),
      operation({
        description: 'WHEN template data returns an error',
        input: format('Welcome, ${firstName}', {
          firstName: ref('error'),
        }),
        expected: withErrorPath(error('test error'), { path: ['error'] }),
      }),
      operation({
        description: 'WHEN template data contains incorrect type of data',
        input: format('Welcome, ${firstName}', {
          firstName: ref('someAction'),
        }),
        expected: withErrorPath(
          error(
            [
              `'format' node expected 'data.firstName' to resolve to a string value() node.`,
              ' Expected:',
              '  value(string)',
              ' Received:',
              `  ${getType(array([]))}`,
            ].join('\n'),
          ),
          { path: ['someAction'] },
        ),
      }),
      operation({
        description: 'WHEN template data is missing a key',
        input: format('Welcome, ${firstName}', {}),
        assert([err]) {
          expect(isErrorNodeDefinition(err)).toBeTruthy();
        },
      }),
    ],
  });
});
