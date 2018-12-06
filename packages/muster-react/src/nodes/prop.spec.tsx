import muster, { action, call, container, prop, propTypes, ref, set, types, variable } from '..';
import { operation, runScenario } from '../test';

describe('prop()', () => {
  runScenario(() => {
    const globalMuster = () => muster({});

    interface TestComponentProps {
      count: number;
      add: () => any;
      $$inject: any;
    }

    const TestContainer = container({
      graph: {
        count: variable(0),
        iOnlyGetCalledOnce: action(function*(a) {
          const count = ref('count');
          const value = yield count;
          yield set(count, value + 1);
        }),
        add: action(function*(a) {
          yield prop('count');
          yield call(ref('iOnlyGetCalledOnce'));
        }),
      },
      props: {
        count: types.any,
        add: propTypes.caller(),
      },
    });

    const TestComponent = (props: TestComponentProps) => null;

    return {
      description: 'GIVEN a container that requests caller and a variable',
      graph: globalMuster,
      container: TestContainer,
      component: TestComponent,
      shallow: true,
      expected: {
        props: {
          count: 0,
          add: expect.any(Function),
        },
      },
      operations: [
        operation({
          description: 'WHEN calling the action using a prop for the first time',
          input: (results) => (results.props as any).add(),
          expected: {
            props: {
              count: 1,
              add: expect.any(Function),
            },
          },
          operations: [
            operation({
              description: 'AND then calling the same action for the second time',
              input: (results) => (results.props as any).add(),
              expected: {
                props: {
                  count: 2,
                  add: expect.any(Function),
                },
              },
            }),
          ],
        }),
      ],
    };
  });
});
