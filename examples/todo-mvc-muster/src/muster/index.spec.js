import { ref, value } from '@dws/muster';
import { operation, runScenario } from '@dws/muster/test';
import createGraph from './index';
import loadItems from '../utils/load-items';

jest.mock('../utils/load-items.js', () => jest.fn(() => []));

describe('Testing a list and its operations', () => {
  runScenario({
    description: 'GIVEN a graph with four completed and three uncompleted todos',
    before() {
      loadItems.mockReturnValue([
        { id: 1, label: 'Item 1', completed: true },
        { id: 2, label: 'Item 2', completed: true },
        { id: 3, label: 'Item 3', completed: true },
        { id: 4, label: 'Item 4', completed: true },
        { id: 5, label: 'Item 5', completed: false },
        { id: 6, label: 'Item 6', completed: false },
        { id: 7, label: 'Item 7', completed: false },
      ]);
    },
    graph: createGraph,
    operations: [
      operation({
        description: 'WHEN getting the itemCount',
        input: ref('itemCount'),
        expected: value(7),
      }),
      operation({
        description: 'WHEN getting the remainingCount',
        input: ref('remainingCount'),
        expected: value(3),
      }),
    ],
  });
});
