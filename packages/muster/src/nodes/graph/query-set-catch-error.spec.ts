import { BehaviorSubject } from '@dws/muster-observable';
import muster, {
  array,
  error,
  fromStream,
  nil,
  NodeDefinition,
  querySet,
  querySetGetChildOperation,
  root,
  toNode,
  value,
} from '../..';
import { operation, runScenario } from '../../test';
import { querySetCatchError } from './query-set-catch-error';

describe('querySetCatchError()', () => {
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
          description: 'WHEN resolving a querySet with catchError for name',
          input: querySet(root(), [querySetCatchError(querySetGetChildOperation('name'))]),
          expected: array([value('Bob')]),
          operations: (subscriber) => [
            operation({
              description: 'AND the nameStream emits an error',
              before() {
                jest.clearAllMocks();
                nameStream.next(error('Something went wrong'));
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
      description: 'GIVEN a graph containing a fromStream node - default error()',
      before() {
        nameStream = new BehaviorSubject<NodeDefinition>(error('Something went wrong'));
      },
      graph: () =>
        muster({
          name: fromStream(nameStream),
        }),
      operations: [
        operation({
          description: 'WHEN resolving a querySet with catchError for name',
          input: querySet(root(), [querySetCatchError(querySetGetChildOperation('name'))]),
          expected: array([nil()]),
          operations: (subscriber) => [
            operation({
              description: 'AND the nameStream emits a value',
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
                  description: 'AND the nameStream emits an error',
                  before() {
                    jest.clearAllMocks();
                    nameStream.next(error('Something went wrong for the 2nd time'));
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
          description: 'WHEN resolving a querySet with catchError for user',
          input: querySet(root(), [
            querySetCatchError(
              querySetGetChildOperation('user', [
                querySetGetChildOperation('firstName'),
                querySetGetChildOperation('lastName'),
              ]),
            ),
          ]),
          expected: array([array([value('Kate'), value('Jonson')])]),
          operations: (subscriber) => [
            operation({
              description: 'AND the userStream emits an error',
              before() {
                jest.clearAllMocks();
                userStream.next(error('Something went wrong'));
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
      description: 'GIVEN a graph containing a fromStream node - default error()',
      before() {
        userStream = new BehaviorSubject<NodeDefinition>(error('Something went wrong'));
      },
      graph: () =>
        muster({
          user: fromStream(userStream),
        }),
      operations: [
        operation({
          description: 'WHEN resolving a querySet with catchError for user',
          input: querySet(root(), [
            querySetCatchError(
              querySetGetChildOperation('user', [
                querySetGetChildOperation('firstName'),
                querySetGetChildOperation('lastName'),
              ]),
            ),
          ]),
          expected: array([nil()]),
          operations: (subscriber) => [
            operation({
              description: 'AND the userStream emits a tree',
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
                  description: 'AND the userStream emits an error',
                  before() {
                    jest.clearAllMocks();
                    userStream.next(error('Something went wrong, again'));
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
