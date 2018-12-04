import { take } from '@dws/muster-observable';
import muster, {
  fromPromise,
  fromStreamMiddleware,
  Muster,
  ok,
  proxy,
  ref,
  set,
  value,
  variable,
} from '../..';
import { operation, runScenario } from '../../test';
import { computed } from './computed';
import { invalidate } from './invalidate';

describe('invalidate()', () => {
  let val: any;

  beforeEach(() => {
    val = 'initial';
  });

  runScenario({
    description: 'GIVEN a muster graph containing a fromPromise node',
    graph: () =>
      muster({
        promise: fromPromise(() => Promise.resolve(val)),
      }),
    operations: [
      operation({
        description: 'WHEN the initial value gets requested',
        input: ref('promise'),
        expected: value('initial'),
        operations: (subscriber) => [
          operation({
            description: 'AND the invalidate is executed',
            before() {
              jest.clearAllMocks();
              val = 'updated';
            },
            input: invalidate(ref('promise')),
            expected: ok(),
            assert() {
              expect(subscriber().next).toHaveBeenCalledTimes(1);
              expect(subscriber().next).toHaveBeenCalledWith(value('updated'));
            },
          }),
        ],
      }),
    ],
  });

  runScenario({
    description: 'GIVEN a muster graph containing a fromPromise node behind a ref',
    graph: () =>
      muster({
        promise: fromPromise(() => Promise.resolve(val)),
        refToPromise: ref('promise'),
      }),
    operations: [
      operation({
        description: 'WHEN the fromPromise is requested directly',
        input: ref('promise'),
        expected: value('initial'),
        operations: (subscriber) => [
          operation({
            description: 'AND the fromPromise node is invalidated directly',
            before() {
              jest.clearAllMocks();
              val = 'updated';
            },
            input: invalidate(ref('promise')),
            expected: ok(),
            assert() {
              expect(subscriber().next).toHaveBeenCalledTimes(1);
              expect(subscriber().next).toHaveBeenCalledWith(value('updated'));
            },
          }),
          operation({
            description: 'AND the fromPromise node is invalidated via the ref',
            before() {
              jest.clearAllMocks();
              val = 'updated';
            },
            input: invalidate(ref('refToPromise')),
            expected: ok(),
            assert() {
              expect(subscriber().next).toHaveBeenCalledTimes(1);
              expect(subscriber().next).toHaveBeenCalledWith(value('updated'));
            },
          }),
        ],
      }),
      operation({
        description: 'WHEN the fromPromise is requested via a ref',
        input: ref('refToPromise'),
        expected: value('initial'),
        operations: (subscriber) => [
          operation({
            description: 'AND the fromPromise node is invalidated directly',
            before() {
              jest.clearAllMocks();
              val = 'updated';
            },
            input: invalidate(ref('promise')),
            expected: ok(),
            assert() {
              expect(subscriber().next).toHaveBeenCalledTimes(1);
              expect(subscriber().next).toHaveBeenCalledWith(value('updated'));
            },
          }),
          operation({
            description: 'AND the fromPromise node is invalidated via the ref',
            before() {
              jest.clearAllMocks();
              val = 'updated';
            },
            input: invalidate(ref('refToPromise')),
            expected: ok(),
            assert() {
              expect(subscriber().next).toHaveBeenCalledTimes(1);
              expect(subscriber().next).toHaveBeenCalledWith(value('updated'));
            },
          }),
        ],
      }),
    ],
  });

  runScenario({
    description: 'GIVEN a muster graph containing a nested fromPromise node',
    graph: () =>
      muster({
        nested: {
          promise: fromPromise(() => Promise.resolve(val)),
        },
      }),
    operations: [
      operation({
        description: 'WHEN the initial value gets requested',
        input: ref('nested', 'promise'),
        expected: value('initial'),
        operations: (subscriber) => [
          operation({
            description: 'AND the parent node is invalidated',
            before() {
              jest.clearAllMocks();
              val = 'updated';
            },
            input: invalidate(ref('nested')),
            expected: ok(),
            assert() {
              expect(subscriber().next).toHaveBeenCalledTimes(1);
              expect(subscriber().next).toHaveBeenCalledWith(value('updated'));
            },
          }),
        ],
      }),
    ],
  });

  runScenario({
    description:
      'GIVEN a muster graph containing static and dynamic fromPromise nodes within computed nodes',
    graph: () => {
      const staticPromiseFactory = () => Promise.resolve(val);
      return muster({
        staticPromise: computed([], () => fromPromise(staticPromiseFactory)),
        dynamicPromise: computed([], () => fromPromise(() => Promise.resolve(val))),
        staticPromiseWithDependencies: computed([value('foo')], () =>
          fromPromise(staticPromiseFactory),
        ),
        dynamicPromiseWithDependencies: computed([value('foo')], () =>
          fromPromise(() => Promise.resolve(val)),
        ),
      });
    },
    operations: [
      operation({
        description: 'WHEN the static computed node gets requested',
        input: ref('staticPromise'),
        expected: value('initial'),
        operations: (subscriber) => [
          operation({
            description: 'AND the static computed node is invalidated',
            before() {
              jest.clearAllMocks();
              val = 'updated';
            },
            input: invalidate(ref('staticPromise')),
            expected: ok(),
            assert() {
              expect(subscriber().next).toHaveBeenCalledTimes(1);
              expect(subscriber().next).toHaveBeenCalledWith(value('updated'));
            },
          }),
        ],
      }),
      operation({
        description: 'WHEN the dynamic computed node gets requested',
        input: ref('dynamicPromise'),
        expected: value('initial'),
        operations: (subscriber) => [
          operation({
            description: 'AND the dynamic computed node is invalidated',
            before() {
              jest.clearAllMocks();
              val = 'updated';
            },
            input: invalidate(ref('dynamicPromise')),
            expected: ok(),
            assert() {
              expect(subscriber().next).toHaveBeenCalledTimes(1);
              expect(subscriber().next).toHaveBeenCalledWith(value('updated'));
            },
          }),
        ],
      }),
      operation({
        description: 'WHEN the static computed node with dependencies gets requested',
        input: ref('staticPromiseWithDependencies'),
        expected: value('initial'),
        operations: (subscriber) => [
          operation({
            description: 'AND the static computed node with dependencies is invalidated',
            before() {
              jest.clearAllMocks();
              val = 'updated';
            },
            input: invalidate(ref('staticPromiseWithDependencies')),
            expected: ok(),
            assert() {
              expect(subscriber().next).toHaveBeenCalledTimes(1);
              expect(subscriber().next).toHaveBeenCalledWith(value('updated'));
            },
          }),
        ],
      }),
      operation({
        description: 'WHEN the dynamic computed node with dependencies gets requested',
        input: ref('dynamicPromiseWithDependencies'),
        expected: value('initial'),
        operations: (subscriber) => [
          operation({
            description: 'AND the dynamic computed node with dependencies is invalidated',
            before() {
              jest.clearAllMocks();
              val = 'updated';
            },
            input: invalidate(ref('dynamicPromiseWithDependencies')),
            expected: ok(),
            assert() {
              expect(subscriber().next).toHaveBeenCalledTimes(1);
              expect(subscriber().next).toHaveBeenCalledWith(value('updated'));
            },
          }),
        ],
      }),
    ],
  });

  runScenario({
    description: 'GIVEN a muster graph containing a variable',
    graph: () =>
      muster({
        variable: variable(undefined),
      }),
    operations: [
      operation({
        description: 'WHEN the variable gets set to a fromPromise node',
        before: () => {
          val = 'initial';
        },
        input: set(ref('variable'), fromPromise(() => Promise.resolve(val))),
        expected: value('initial'),
        operations: (setSubscriber) => [
          operation({
            description: 'AND the variable gets requested',
            input: ref('variable'),
            expected: value('initial'),
            operations: (subscriber) => [
              operation({
                description: 'AND the variable gets invalidated after unsubscribing from the set',
                before() {
                  setSubscriber().subscription.unsubscribe();
                  jest.clearAllMocks();
                  val = 'updated';
                },
                input: invalidate(ref('variable')),
                expected: ok(),
                assert() {
                  expect(subscriber().next).toHaveBeenCalledTimes(1);
                  expect(subscriber().next).toHaveBeenCalledWith(value('updated'));
                },
              }),
              operation({
                description: 'AND the variable gets invalidated without unsubscribing from the set',
                before() {
                  jest.clearAllMocks();
                  val = 'updated';
                },
                input: invalidate(ref('variable')),
                expected: ok(),
                assert() {
                  expect(subscriber().next).toHaveBeenCalledTimes(1);
                  expect(subscriber().next).toHaveBeenCalledWith(value('updated'));
                },
              }),
            ],
          }),
        ],
      }),
    ],
  });

  let remoteMuster: Muster;
  runScenario({
    description: 'GIVEN a muster graph connected to the remote muster graph through a proxy',
    before() {
      remoteMuster = muster({
        promise: fromPromise(() => Promise.resolve(val)),
      });
    },
    graph: () =>
      muster({
        proxy: proxy([
          fromStreamMiddleware((val) => take(1, remoteMuster.resolve(val, { raw: true }))),
        ]),
      }),
    operations: [
      operation({
        description: 'WHEN the initial value gets requested',
        input: ref('proxy', 'promise'),
        expected: value('initial'),
        operations: (subscriber) => [
          operation({
            description: 'AND the invalidate is executed for the proxy node',
            before() {
              jest.clearAllMocks();
              val = 'updated';
            },
            input: invalidate(ref('proxy')),
            expected: ok(),
            assert() {
              expect(subscriber().next).toHaveBeenCalledTimes(1);
              expect(subscriber().next).toHaveBeenCalledWith(value('updated'));
            },
          }),
        ],
      }),
    ],
  });
});
