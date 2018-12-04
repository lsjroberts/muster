import muster, { action, propTypes, ref, relative } from '.';
import { simpleContainer } from './simple-container';
import { operation, runScenario } from './test';

describe('simpleContainer()', () => {
  runScenario({
    description: 'GIVEN a container with no props',
    graph: () => muster({}),
    container: simpleContainer({}),
    expected: {
      props: {},
    },
  });

  runScenario({
    description: 'GIVEN a container with one prop',
    graph: () =>
      muster({
        name: 'Test name',
      }),
    container: simpleContainer({
      name: true,
    }),
    expected: {
      props: {
        name: 'Test name',
      },
    },
  });

  runScenario({
    description: 'GIVEN a container with nested props',
    graph: () =>
      muster({
        data: {
          user: {
            firstName: 'Bob',
            lastName: 'Smith',
          },
        },
      }),
    container: simpleContainer({
      data: {
        user: {
          firstName: true,
          lastName: true,
        },
      },
    }),
    expected: {
      props: {
        data: {
          user: {
            firstName: 'Bob',
            lastName: 'Smith',
          },
        },
      },
    },
  });

  runScenario({
    description: 'GIVEN a container with props and query prefix',
    graph: () =>
      muster({
        data: {
          user: {
            firstName: 'Bob',
            lastName: 'Smith',
          },
        },
      }),
    container: simpleContainer(['data', 'user'], {
      firstName: true,
      lastName: true,
    }),
    expected: {
      props: {
        firstName: 'Bob',
        lastName: 'Smith',
      },
    },
  });

  runScenario({
    description: 'GIVEN a collection of items with name and action',
    graph: () =>
      muster({
        someItems: [
          {
            name: 'Item 1',
            getName: action(function*() {
              return yield ref(relative('name'));
            }),
          },
          {
            name: 'Item 2',
            getName: action(function*() {
              return yield ref(relative('name'));
            }),
          },
        ],
      }),
    container: simpleContainer({
      someItems: propTypes.list({
        name: true,
        getName: propTypes.caller(),
      }),
    }),
    expected: {
      props: {
        someItems: [
          { name: 'Item 1', getName: expect.any(Function) },
          { name: 'Item 2', getName: expect.any(Function) },
        ],
      },
    },
    operations: [
      operation({
        description: 'WHEN the getName() is called on the first item',
        input: (results) => results.props.someItems[0].getName(),
        expected: {
          value: 'Item 1',
        },
      }),
      operation({
        description: 'WHEN the getName() is called on the second item',
        input: (results) => results.props.someItems[1].getName(),
        expected: {
          value: 'Item 2',
        },
      }),
    ],
  });
});
