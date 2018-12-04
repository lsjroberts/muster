import muster, {
  action,
  call,
  Muster,
  NodeDefinition,
  once,
  ref,
  root,
  scope,
  set,
  toNode,
  value,
  variable,
} from '@dws/muster';
import { operation, runScenario } from '@dws/muster/test';
import { GLOBAL_ROOT_NODE } from '../nodes/global-root';
import global from './global';

describe('local', () => {
  describe('GIVEN the global muster graph', () => {
    let app: Muster;
    beforeEach(() => {
      app = muster({});
    });

    describe('AND the local muster graph', () => {
      let globalContext: any;
      let globalGraph: NodeDefinition;
      beforeEach(() => {
        globalGraph = toNode({
          test: variable(1),
        });
        globalContext = {
          [GLOBAL_ROOT_NODE]: globalGraph,
        };
      });

      it('SHOULD correctly set the value', (done) => {
        app
          .resolve(set(ref(global('test')), 2), { context: globalContext, raw: true })
          .subscribe((val) => {
            expect(val).toEqual(value(2));
            done();
          });
      });
    });
  });

  runScenario({
    description: 'AND a local graph that injects the global graph',
    graph: () =>
      muster({
        counter: variable(1),
        container1: scope(
          {
            counter: ref(global('counter')),
            update: action((updatedValue) => set(ref(global('counter')), updatedValue)),
          },
          { [GLOBAL_ROOT_NODE]: root() },
        ),
        container2: scope(
          {
            counter: ref(global('counter')),
            update: action((updatedValue) => set(ref(global('counter')), updatedValue)),
          },
          { [GLOBAL_ROOT_NODE]: root() },
        ),
      }),
    operations: [
      operation({
        description: 'AND the global counter is retrieved via the local graph',
        input: ref('container1', 'counter'),
        expected: value(1),
      }),
      operation({
        description: 'AND the global counter is incremented via the local graph',
        input: once(call(ref('container1', 'update'), [value(2)])),
        expected: value(2),
        operations: [
          operation({
            description: 'AND the global counter is retrieved directly',
            input: ref('counter'),
            expected: value(2),
          }),
          operation({
            description: 'AND the global counter is retrieved via the local graph',
            input: ref('container1', 'counter'),
            expected: value(2),
          }),
          operation({
            description: 'AND the global counter is retrieved via another local graph',
            input: ref('container2', 'counter'),
            expected: value(2),
          }),
          operation({
            description: 'AND the global counter is incremented via another local graph',
            input: once(call(ref('container2', 'update'), [value(3)])),
            expected: value(3),
            operations: [
              operation({
                description: 'AND the global counter is retrieved directly',
                input: ref('counter'),
                expected: value(3),
              }),
              operation({
                description: 'AND the global counter is retrieved via the local graph',
                input: ref('container1', 'counter'),
                expected: value(3),
              }),
              operation({
                description: 'AND the global counter is retrieved via another local graph',
                input: ref('container2', 'counter'),
                expected: value(3),
              }),
            ],
          }),
        ],
      }),
    ],
  });
});
