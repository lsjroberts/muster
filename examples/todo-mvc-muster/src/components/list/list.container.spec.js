import muster, {
  applyTransforms,
  arrayList,
  count,
  eq,
  filter,
  get,
  head,
  length,
  ref,
  toNode,
  variable,
} from '@dws/muster-react';
import { operation, runScenario } from '@dws/muster-react/test';
import ListContainer from './list.container';

function createGlobalGraph({ items, path } = {}) {
  return muster({
    itemCount: ref('itemList', length()),
    itemList: arrayList((items || []).map(createItem)),
    remainingCount: head(
      applyTransforms(ref('itemList'), [
        filter((item) => eq(get(item, 'completed'), false)),
        count(),
      ]),
    ),
    nav: {
      path: variable(path || '/'),
    },
  });
}

function createItem({ id, label, completed }) {
  return toNode({
    id,
    label: variable(label),
    completed: variable(completed),
    editing: variable(false),
    temp: variable(''),
  });
}

describe('ListContainer', () => {
  const items = [
    { id: 1, label: 'first item', completed: true },
    { id: 2, label: 'second item', completed: false },
    { id: 3, label: 'third item', completed: false },
    { id: 4, label: 'fourth item', completed: true },
    { id: 5, label: 'fifth item', completed: false },
  ];

  function toItemMatcher({ id, label, completed }) {
    return {
      id,
      label,
      completed,
      editing: false,
      temp: '',
      setCompleted: expect.any(Function),
      setEditing: expect.any(Function),
      setLabel: expect.any(Function),
      setTemp: expect.any(Function),
    };
  }

  describe('Filtered items list', () => {
    describe('GIVEN a list of items, and a path = /', () => {
      runScenario({
        description: 'AND a ListContainer connected to the global graph',
        graph: () => createGlobalGraph({ items, path: '/' }),
        container: ListContainer,
        expected: {
          props: expect.objectContaining({
            itemList: items.map(toItemMatcher),
          }),
        },
      });
    });

    describe('GIVEN a list of items, and a path = /active', () => {
      runScenario({
        description: 'AND a ListContainer connected to the global graph',
        graph: () => createGlobalGraph({ items, path: '/active' }),
        container: ListContainer,
        expected: {
          props: expect.objectContaining({
            itemList: items.filter(({ completed }) => !completed).map(toItemMatcher),
          }),
        },
      });
    });

    describe('GIVEN a list of items, and a path = /completed', () => {
      runScenario({
        description: 'AND a ListContainer connected to the global graph',
        graph: () => createGlobalGraph({ items, path: '/completed' }),
        container: ListContainer,
        expected: {
          props: expect.objectContaining({
            itemList: items.filter(({ completed }) => completed).map(toItemMatcher),
          }),
        },
      });
    });
  });

  describe('Removing an item', () => {
    runScenario({
      description: 'GIVEN a ListContainer connected to the global graph',
      graph: () => createGlobalGraph({ items }),
      container: ListContainer,
      expected: {
        props: {
          itemList: items.map(toItemMatcher),
          remove: expect.any(Function),
        },
      },
      operations: [
        operation({
          description: 'WHEN the remove is called for an existing Todo ID',
          input: (data) => data.props.remove(1),
          expected: {
            props: expect.objectContaining({
              itemList: items.filter(({ id }) => id !== 1).map(toItemMatcher),
            }),
          },
        }),
      ],
    });
  });
});
