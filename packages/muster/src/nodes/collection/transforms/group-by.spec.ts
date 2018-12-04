import muster, {
  applyTransforms,
  entries,
  get,
  iterate,
  NodeDefinition,
  query,
  ref,
  value,
} from '../../..';
import { operation, runScenario } from '../../../test';
import { groupBy } from './group-by';

describe('groupBy()', () => {
  describe('Using getItems operation', () => {
    runScenario({
      description: 'GIVEN a collection containing items with repeating name',
      graph: () =>
        muster({
          items: [
            { name: 'first', value: '1' },
            { name: 'first', value: '2' },
            { name: 'first', value: '3' },
            { name: 'second', value: '4' },
            { name: 'second', value: '5' },
          ],
          groupedItems: applyTransforms(ref('items'), [
            groupBy((item: NodeDefinition) => get(item, 'name')),
          ]),
        }),
      operations: [
        operation({
          description: 'WHEN making a query to list the items grouped by name',
          input: query(
            ref('groupedItems'),
            entries(
              entries({
                name: true,
                value: true,
              }),
            ),
          ),
          expected: value([
            [
              { name: 'first', value: '1' },
              { name: 'first', value: '2' },
              { name: 'first', value: '3' },
            ],
            [{ name: 'second', value: '4' }, { name: 'second', value: '5' }],
          ]),
        }),
      ],
    });
  });

  describe('Using iterators', () => {
    runScenario({
      description: 'GIVEN a collection containing items with repeating name',
      graph: () =>
        muster({
          items: [
            { name: 'first', value: '1' },
            { name: 'first', value: '2' },
            { name: 'first', value: '3' },
            { name: 'second', value: '4' },
            { name: 'second', value: '5' },
          ],
          groupedItems: iterate(ref('items'), [
            groupBy((item: NodeDefinition) => get(item, 'name')),
          ]),
        }),
      operations: [
        operation({
          description: 'WHEN making a query to list the items grouped by name',
          input: query(
            ref('groupedItems'),
            entries(
              entries({
                name: true,
                value: true,
              }),
            ),
          ),
          expected: value([
            [
              { name: 'first', value: '1' },
              { name: 'first', value: '2' },
              { name: 'first', value: '3' },
            ],
            [{ name: 'second', value: '4' }, { name: 'second', value: '5' }],
          ]),
        }),
      ],
    });
  });
});
