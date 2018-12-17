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
import FooterContainer from './footer.container';

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

describe('FooterContainer', () => {
  describe('Clearing completed', () => {
    runScenario({
      description: 'GIVEN a FooterContainer connected to global graph with no items',
      graph: () => createGlobalGraph(),
      container: FooterContainer,
      expected: {
        props: expect.objectContaining({
          clearCompleted: expect.any(Function),
          itemCount: 0,
          remainingCount: 0,
        }),
      },
      operations: [
        operation({
          description: 'WHEN the clearCompleted is called',
          input: (data) => data.props.clearCompleted(),
          expected: {
            // The component should not be rendered
            props: [],
          },
        }),
      ],
    });

    runScenario({
      description: 'GIVEN a FooterContainer connected to global graph with no completed items',
      graph: () =>
        createGlobalGraph({
          items: [
            { id: 1, label: 'first item', completed: false },
            { id: 2, label: 'second item', completed: false },
            { id: 3, label: 'third item', completed: false },
          ],
        }),
      container: FooterContainer,
      expected: {
        props: expect.objectContaining({
          clearCompleted: expect.any(Function),
          itemCount: 3,
          remainingCount: 3,
        }),
      },
      operations: [
        operation({
          description: 'WHEN the clearCompleted is called',
          input: (data) => data.props.clearCompleted(),
          expected: {
            // The component should not be rendered
            props: [],
          },
        }),
      ],
    });

    runScenario({
      description: 'GIVEN a FooterContainer connected to global graph with some completed items',
      graph: () =>
        createGlobalGraph({
          items: [
            { id: 1, label: 'first item', completed: true },
            { id: 2, label: 'second item', completed: false },
            { id: 3, label: 'third item', completed: true },
          ],
        }),
      container: FooterContainer,
      expected: {
        props: expect.objectContaining({
          clearCompleted: expect.any(Function),
          itemCount: 3,
          remainingCount: 1,
        }),
      },
      operations: [
        operation({
          description: 'WHEN the clearCompleted is called',
          input: (data) => data.props.clearCompleted(),
          expected: {
            // The component should not be rendered
            props: expect.objectContaining({
              itemCount: 1,
              remainingCount: 1,
            }),
          },
        }),
      ],
    });
  });

  describe('Footer classes', () => {
    runScenario({
      description: 'GIVEN a global graph with / path',
      graph: () => createGlobalGraph({ path: '/' }),
      container: FooterContainer,
      expected: {
        props: expect.objectContaining({
          footerClasses: {
            allClass: 'selected',
            activeClass: '',
            completedClass: '',
          },
        }),
      },
    });

    runScenario({
      description: 'GIVEN a global graph with /active path',
      graph: () => createGlobalGraph({ path: '/active' }),
      container: FooterContainer,
      expected: {
        props: expect.objectContaining({
          footerClasses: {
            allClass: '',
            activeClass: 'selected',
            completedClass: '',
          },
        }),
      },
    });

    runScenario({
      description: 'GIVEN a global graph with /completed path',
      graph: () => createGlobalGraph({ path: '/completed' }),
      container: FooterContainer,
      expected: {
        props: expect.objectContaining({
          footerClasses: {
            allClass: '',
            activeClass: '',
            completedClass: 'selected',
          },
        }),
      },
    });
  });
});
