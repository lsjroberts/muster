import muster, { computed, error, get, ref, root, value } from '../..';
import { operation, runScenario } from '../../test';
import { withErrorPath } from './error';
import { parent } from './parent';

describe('parent', () => {
  runScenario({
    description: 'GIVEN a graph with a parent node as the root node',
    graph: () => muster(parent()),
    operations: [
      operation({
        description: 'SHOULD return an error when attempting to fetch the root',
        input: root(),
        expected: withErrorPath(error('Cannot resolve parent of root node'), { path: [] }),
      }),
    ],
  });

  runScenario({
    description: 'GIVEN a graph containing a sibling reference',
    graph: () =>
      muster({
        foo: get(parent(), value('bar')),
        bar: value('value:bar'),
      }),
    operations: [
      operation({
        description: 'SHOULD return the sibling value',
        input: ref('foo'),
        expected: value('value:bar'),
      }),
    ],
  });

  runScenario({
    description: 'GIVEN a graph containing a deeply nested sibling reference',
    graph: () =>
      muster({
        deeply: {
          nested: {
            foo: get(parent(), value('bar')),
            bar: value('value:bar'),
          },
        },
      }),
    operations: [
      operation({
        description: 'SHOULD return the sibling value',
        input: ref('deeply', 'nested', 'foo'),
        expected: value('value:bar'),
      }),
    ],
  });

  runScenario({
    description: 'GIVEN a graph containing a computed node using a parent node',
    graph: () =>
      muster({
        something: computed([], () => get(parent(), 'other')),
        other: 'other value',
      }),
    operations: [
      operation({
        description: 'WHEN the computed node gets requested',
        input: ref('something'),
        expected: value('other value'),
      }),
    ],
  });
});
