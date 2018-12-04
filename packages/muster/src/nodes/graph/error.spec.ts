import muster, { error, key, query, ref, root, withErrorPath } from '../..';
import { operation, runScenario } from '../../test';

describe('error()', () => {
  runScenario({
    description: 'GIVEN an error with just a message',
    graph: () =>
      muster({
        name: error('Test error'),
      }),
    operations: [
      operation({
        description: 'WHEN the error is requested as ref',
        input: ref('name'),
        expected: withErrorPath(error('Test error'), { path: ['name'] }),
      }),
      operation({
        description: 'WHEN the error is requested as part of a query',
        input: query(root(), {
          name: key('name'),
        }),
        expected: withErrorPath(error('Test error'), { path: ['name'] }),
      }),
    ],
  });

  runScenario({
    description: 'GIVEN an error with a message and a code',
    graph: () =>
      muster({
        name: error('Test error', { code: '500' }),
      }),
    operations: [
      operation({
        description: 'WHEN the error is requested as ref',
        input: ref('name'),
        expected: withErrorPath(error('Test error', { code: '500' }), { path: ['name'] }),
      }),
      operation({
        description: 'WHEN the error is requested as part of a query',
        input: query(root(), {
          name: key('name'),
        }),
        expected: withErrorPath(error('Test error', { code: '500' }), { path: ['name'] }),
      }),
    ],
  });

  runScenario({
    description: 'GIVEN an error with a message, a code and a string data',
    graph: () =>
      muster({
        name: error('Test error', { code: '500', data: 'Test data' }),
      }),
    operations: [
      operation({
        description: 'WHEN the error is requested as ref',
        input: ref('name'),
        expected: withErrorPath(error('Test error', { code: '500', data: 'Test data' }), {
          path: ['name'],
        }),
      }),
      operation({
        description: 'WHEN the error is requested as part of a query',
        input: query(root(), {
          name: key('name'),
        }),
        expected: withErrorPath(error('Test error', { code: '500', data: 'Test data' }), {
          path: ['name'],
        }),
      }),
    ],
  });

  runScenario({
    description: 'GIVEN an error with a message, a code and data (object)',
    graph: () =>
      muster({
        name: error('Test error', { code: '500', data: { something: 'test value' } }),
      }),
    operations: [
      operation({
        description: 'WHEN the error is requested as ref',
        input: ref('name'),
        expected: withErrorPath(
          error('Test error', { code: '500', data: { something: 'test value' } }),
          { path: ['name'] },
        ),
      }),
      operation({
        description: 'WHEN the error is requested as part of a query',
        input: query(root(), {
          name: key('name'),
        }),
        expected: withErrorPath(
          error('Test error', { code: '500', data: { something: 'test value' } }),
          { path: ['name'] },
        ),
      }),
    ],
  });
});
