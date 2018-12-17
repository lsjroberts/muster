import muster, {
  applyTransforms,
  arrayList,
  count,
  eq,
  filter,
  get,
  head,
  length,
  push,
  ref,
  toNode,
  variable,
} from '@dws/muster-react';
import { operation, runScenario } from '@dws/muster-react/test';
import AppContainer from './app.container';

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

describe('AppContainer', () => {
  describe('GIVEN a global graph with no items', () => {
    runScenario({
      description: 'AND an AppContainer',
      graph: () => createGlobalGraph(),
      container: AppContainer,
      expected: {
        props: {
          itemCount: 0,
          remainingCount: 0,
          toggleAll: expect.any(Function),
        },
      },
      operations: [
        operation({
          description: 'AND a new not-completed item is added',
          input: push(
            ref('itemList'),
            createItem({
              id: 1,
              label: 'first item',
              completed: false,
            }),
          ),
          expected: {
            props: expect.objectContaining({
              itemCount: 1,
              remainingCount: 1,
            }),
          },
          operations: [
            operation({
              description: 'AND a new completed item is added',
              input: push(
                ref('itemList'),
                createItem({
                  id: 2,
                  label: 'second item',
                  completed: true,
                }),
              ),
              expected: {
                props: expect.objectContaining({
                  itemCount: 2,
                  remainingCount: 1,
                }),
              },
              operations: [
                operation({
                  description: 'AND toggleAll is called',
                  input: (data) => data.props.toggleAll(),
                  expected: {
                    props: expect.objectContaining({
                      itemCount: 2,
                      remainingCount: 0,
                    }),
                  },
                  operations: [
                    operation({
                      description: 'AND toggleAll is called again',
                      input: (data) => data.props.toggleAll(),
                      expected: {
                        props: expect.objectContaining({
                          itemCount: 2,
                          remainingCount: 2,
                        }),
                      },
                    }),
                  ],
                }),
              ],
            }),
          ],
        }),
      ],
    });
  });

  describe('GIVEN a global graph with some items', () => {
    runScenario({
      description: 'AND an AppContainer',
      graph: () =>
        createGlobalGraph({
          items: [
            { id: 1, label: 'first item', completed: false },
            { id: 2, label: 'second item', completed: false },
            { id: 3, label: 'third item', completed: true },
          ],
        }),
      container: AppContainer,
      expected: {
        props: {
          itemCount: 3,
          remainingCount: 2,
          toggleAll: expect.any(Function),
        },
      },
      operations: [
        operation({
          description: 'AND toggleAll is called',
          input: (data) => data.props.toggleAll(),
          expected: {
            props: expect.objectContaining({
              itemCount: 3,
              remainingCount: 0,
            }),
          },
          operations: [
            operation({
              description: 'AND toggleAll is called again',
              input: (data) => data.props.toggleAll(),
              expected: {
                props: expect.objectContaining({
                  itemCount: 3,
                  remainingCount: 3,
                }),
              },
            }),
          ],
        }),
      ],
    });
  });
});
