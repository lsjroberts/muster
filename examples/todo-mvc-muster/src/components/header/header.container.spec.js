import muster, {
  applyTransforms,
  arrayList,
  count,
  eq,
  entries,
  filter,
  get,
  head,
  length,
  query,
  ref,
  toNode,
  variable,
  value,
} from '@dws/muster-react';
import { operation, runScenario } from '@dws/muster-react/test';
import HeaderContainer from './header.container';
import getNextTodoId from '../../utils/get-next-todo-id';

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

jest.mock('../../utils/get-next-todo-id', () => jest.fn());

describe('HeaderContainer', () => {
  runScenario({
    description: 'GIVEN a HeaderContainer connected to the global graph',
    graph: () => createGlobalGraph(),
    container: HeaderContainer,
    expected: {
      props: {
        addItem: expect.any(Function),
      },
    },
    operations: [
      operation({
        description: 'WHEN making a query to get the list of all items',
        input: query(
          ref('itemList'),
          entries({
            id: true,
            label: true,
            completed: true,
            editing: true,
            temp: true,
          }),
        ),
        expected: value([]),
        operations: [
          operation({
            description: 'AND the addItem is called',
            before() {
              getNextTodoId.mockReturnValue(1);
            },
            input: (data) => data.props.addItem('first item'),
            operations: [
              operation({
                description: 'AND the list of items is re-requested',
                input: query(
                  ref('itemList'),
                  entries({
                    id: true,
                    label: true,
                    completed: true,
                    editing: true,
                    temp: true,
                  }),
                ),
                expected: value([
                  {
                    id: 1,
                    label: 'first item',
                    completed: false,
                    editing: false,
                    temp: '',
                  },
                ]),
              }),
            ],
          }),
        ],
      }),
    ],
  });
});
