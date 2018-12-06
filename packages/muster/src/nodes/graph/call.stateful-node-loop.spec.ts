import muster, {
  call,
  createNodeDefinition,
  createNodeType,
  fn,
  fromPromise,
  GetChildOperation,
  graphTypes,
  NodeDefinition,
  notFound,
  root,
  StatefulGraphNode,
  types,
  value,
} from '../..';
import { operation, runScenario } from '../../test';

interface ContainerNode extends StatefulGraphNode<'caller-container'> {}

interface ContainerNodeState {
  children: { [key: string]: NodeDefinition };
  currentNumber: number;
}

const ContainerNodeType = createNodeType('caller-container', {
  shape: {},
  state: {
    children: types.objectOf(graphTypes.nodeDefinition),
    currentNumber: types.number,
  },
  getInitialState() {
    return {
      children: {},
      currentNumber: 1,
    };
  },
  operations: {
    evaluate: {
      run(
        node: ContainerNode,
        operation: never,
        dependencies: never,
        context: never,
        state: ContainerNodeState,
      ) {
        return value(`Hello ${state.currentNumber}`);
      },
    },
    getChild: {
      run(
        node: ContainerNode,
        operation: GetChildOperation,
        dependencies: never,
        context: never,
        state: ContainerNodeState,
      ) {
        return state.children[operation.properties.key];
      },
      onSubscribe(node: ContainerNode, operation: GetChildOperation) {
        const { key } = operation.properties;
        const result =
          key !== 'change'
            ? notFound(`Key not found: ${key}`)
            : fn(() =>
                fromPromise(() => {
                  this.setState((state) => ({
                    ...state,
                    currentNumber: state.currentNumber + 1,
                  }));
                  return Promise.resolve(true);
                }),
              );
        this.setState((state) => ({
          ...state,
          children: {
            ...state.children,
            [key]: result,
          },
        }));
      },
    },
  },
});

function container() {
  return createNodeDefinition(ContainerNodeType, {});
}

describe('call()', () => {
  describe('Test calling an action which modifies the parent of an action', () => {
    runScenario({
      description: 'GIVEN a graph containing a tree, value and an fn node',
      graph: () => muster(container()),
      operations: [
        operation({
          description: 'WHEN the `name` is requested',
          input: root(),
          expected: value('Hello 1'),
          operations: (subscriber) => [
            operation({
              description: 'AND then the `changeName` is called',
              before() {
                jest.clearAllMocks();
              },
              input: call('change'),
              assert() {
                expect(subscriber().next).toHaveBeenCalledTimes(1);
                expect(subscriber().next).toHaveBeenCalledWith(value('Hello 2'));
              },
            }),
          ],
        }),
      ],
    });
  });
});
