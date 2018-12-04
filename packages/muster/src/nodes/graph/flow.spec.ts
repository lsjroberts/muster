import muster, { action, call, fn, format, identity, ref, set, value, variable } from '../..';
import { operation, runScenario } from '../../test';
import { flow } from './flow';
import { setResult } from './set-result';

describe('flow()', () => {
  runScenario({
    description: 'GIVEN an empty graph',
    graph: () => muster({}),
    operations: [
      operation({
        description: 'WHEN resolving an empty flow() node',
        input: call(flow()),
        expected: value(undefined),
      }),
    ],
  });

  runScenario({
    description: 'GIVEN a flow node with an identity node',
    graph: () =>
      muster({
        node: flow(identity()),
      }),
    operations: [
      operation({
        description: 'WHEN calling a flow node',
        input: call(ref('node'), [value('test')]),
        expected: value('test'),
      }),
    ],
  });

  runScenario({
    description: 'GIVEN a flow node with two identity nodes',
    graph: () =>
      muster({
        node: flow(
          identity(),
          identity(),
        ),
      }),
    operations: [
      operation({
        description: 'WHEN calling a flow node',
        input: call(ref('node'), [value('test')]),
        expected: value('test'),
      }),
    ],
  });

  runScenario({
    description: 'GIVEN a flow node with fn() and an action()',
    graph: () =>
      muster({
        createArticle: fn(() =>
          // Fake creating article, and just return the ID
          value('test-id'),
        ),
        url: variable('/'),
        flow: flow(
          ref('createArticle'),
          action((id) => set('url', `/article/${id}`)),
        ),
      }),
    operations: [
      operation({
        description: 'WHEN the url is requested',
        input: ref('url'),
        expected: value('/'),
        operations: (subscriber) => [
          operation({
            description: 'AND the flow is called',
            before() {
              jest.clearAllMocks();
            },
            input: call(ref('flow')),
            expected: value('/article/test-id'),
            assert() {
              expect(subscriber().next).toHaveBeenCalledWith(value('/article/test-id'));
              expect(subscriber().next).toHaveBeenCalledTimes(1);
            },
          }),
        ],
      }),
    ],
  });

  runScenario({
    description: 'GIVEN a flow node with two fn()',
    graph: () =>
      muster({
        createArticle: fn(() =>
          // Fake creating article, and just return the ID
          value('test-id'),
        ),
        url: variable('/'),
        flow: flow(
          ref('createArticle'),
          fn((id) => setResult('url', format('/article/${id}', { id }))),
        ),
      }),
    operations: [
      operation({
        description: 'WHEN the url is requested',
        input: ref('url'),
        expected: value('/'),
        operations: (subscriber) => [
          operation({
            description: 'AND the flow is called',
            before() {
              jest.clearAllMocks();
            },
            input: call(ref('flow')),
            expected: value('/article/test-id'),
            assert() {
              expect(subscriber().next).toHaveBeenCalledWith(value('/article/test-id'));
              expect(subscriber().next).toHaveBeenCalledTimes(1);
            },
          }),
        ],
      }),
    ],
  });
});
