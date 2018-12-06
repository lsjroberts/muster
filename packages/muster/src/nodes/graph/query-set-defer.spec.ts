import { BehaviorSubject } from '@dws/muster-observable';
import muster, {
  array,
  fromStream,
  nil,
  NodeDefinition,
  pending,
  querySet,
  querySetGetChildOperation,
  root,
  toNode,
  value,
} from '../..';
import { operation, runScenario } from '../../test';
import { querySetDefer } from './query-set-defer';

describe('querySetDefer()', () => {
  runScenario(() => {
    let nameStream: BehaviorSubject<NodeDefinition>;
    return {
      description: 'GIVEN a graph containing a fromStream node - default value()',
      before() {
        nameStream = new BehaviorSubject<NodeDefinition>(value('Bob'));
      },
      graph: () =>
        muster({
          name: fromStream(nameStream),
        }),
      operations: [
        operation({
          description: 'WHEN resolving a querySet with defer for name',
          input: querySet(root(), [querySetDefer(querySetGetChildOperation('name'))]),
          expected: array([value('Bob')]),
          operations: (subscriber) => [
            operation({
              description: 'AND the nameStream emits a pending()',
              before() {
                jest.clearAllMocks();
                nameStream.next(pending());
              },
              assert() {
                expect(subscriber().next).not.toHaveBeenCalled();
              },
            }),
          ],
        }),
      ],
    };
  });

  runScenario(() => {
    let nameStream: BehaviorSubject<NodeDefinition>;
    return {
      description: 'GIVEN a graph containing a fromStream node - default pending()',
      before() {
        nameStream = new BehaviorSubject<NodeDefinition>(pending());
      },
      graph: () =>
        muster({
          name: fromStream(nameStream),
        }),
      operations: [
        operation({
          description: 'WHEN resolving a querySet with defer for name',
          input: querySet(root(), [querySetDefer(querySetGetChildOperation('name'))]),
          expected: array([nil()]),
          operations: (subscriber) => [
            operation({
              description: 'AND the nameStream emits a value()',
              before() {
                jest.clearAllMocks();
                nameStream.next(value('Bob'));
              },
              assert() {
                expect(subscriber().next).toHaveBeenCalledTimes(1);
                expect(subscriber().next).toHaveBeenCalledWith(array([value('Bob')]));
              },
              operations: [
                operation({
                  description: 'AND the nameStream emits a pending()',
                  before() {
                    jest.clearAllMocks();
                    nameStream.next(pending());
                  },
                  assert() {
                    expect(subscriber().next).not.toHaveBeenCalled();
                  },
                }),
              ],
            }),
          ],
        }),
      ],
    };
  });

  runScenario(() => {
    let userStream: BehaviorSubject<NodeDefinition>;
    return {
      description: 'GIVEN a graph containing a fromStream node - default tree()',
      before() {
        userStream = new BehaviorSubject<NodeDefinition>(
          toNode({
            firstName: 'Kate',
            lastName: 'Jonson',
          }),
        );
      },
      graph: () =>
        muster({
          user: fromStream(userStream),
        }),
      operations: [
        operation({
          description: 'WHEN resolving a querySet with defer for user',
          input: querySet(root(), [
            querySetDefer(
              querySetGetChildOperation('user', [
                querySetGetChildOperation('firstName'),
                querySetGetChildOperation('lastName'),
              ]),
            ),
          ]),
          expected: array([array([value('Kate'), value('Jonson')])]),
          operations: (subscriber) => [
            operation({
              description: 'AND the userStream emits a pending()',
              before() {
                jest.clearAllMocks();
                userStream.next(pending());
              },
              assert() {
                expect(subscriber().next).not.toHaveBeenCalled();
              },
            }),
          ],
        }),
      ],
    };
  });

  runScenario(() => {
    let userStream: BehaviorSubject<NodeDefinition>;
    return {
      description: 'GIVEN a graph containing a fromStream node - default pending()',
      before() {
        userStream = new BehaviorSubject<NodeDefinition>(pending());
      },
      graph: () =>
        muster({
          user: fromStream(userStream),
        }),
      operations: [
        operation({
          description: 'WHEN resolving a querySet with defer for user',
          input: querySet(root(), [
            querySetDefer(
              querySetGetChildOperation('user', [
                querySetGetChildOperation('firstName'),
                querySetGetChildOperation('lastName'),
              ]),
            ),
          ]),
          expected: array([nil()]),
          operations: (subscriber) => [
            operation({
              description: 'AND the userStream emits a tree()',
              before() {
                jest.clearAllMocks();
                userStream.next(
                  toNode({
                    firstName: 'Kate',
                    lastName: 'Jonson',
                  }),
                );
              },
              assert() {
                expect(subscriber().next).toHaveBeenCalledTimes(1);
                expect(subscriber().next).toHaveBeenCalledWith(
                  array([array([value('Kate'), value('Jonson')])]),
                );
              },
              operations: [
                operation({
                  description: 'AND the userStream emits a pending() again',
                  before() {
                    jest.clearAllMocks();
                    userStream.next(pending());
                  },
                  assert() {
                    expect(subscriber().next).not.toHaveBeenCalled();
                  },
                }),
              ],
            }),
          ],
        }),
      ],
    };
  });
});
