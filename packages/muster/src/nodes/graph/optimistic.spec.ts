import muster, {
  error,
  fromPromise,
  ifPending,
  isUpdating,
  ok,
  ref,
  set,
  value,
  variable,
} from '../..';
import { operation, runScenario } from '../../test';
import { withErrorPath } from './error';
import { optimistic } from './optimistic';

describe('optimistic()', () => {
  runScenario({
    description: 'GIVEN a variable node wrapped in an optimistic node',
    graph: () =>
      muster({
        name: optimistic(variable('initial')),
      }),
    operations: [
      operation({
        description: 'WHEN the value of the variable is requested',
        input: ref('name'),
        expected: value('initial'),
        operations: (subscriber) => [
          operation({
            description: 'AND the optimistic variable is set',
            before() {
              jest.clearAllMocks();
            },
            input: set('name', 'updated'),
            expected: value('updated'),
            assert() {
              expect(subscriber().next).toHaveBeenCalledTimes(1);
              expect(subscriber().next).toHaveBeenCalledWith(value('updated'));
            },
            operations: [
              operation({
                description: 'AND isUpdating is resolved on that optimistic variable',
                input: isUpdating(ref('name')),
                expected: value(false),
              }),
            ],
          }),
          operation({
            description: 'AND the subscription is closed',
            before() {
              subscriber().subscription.unsubscribe();
            },
            operations: [
              operation({
                description: 'AND the optimistic variable is set',
                input: set('name', 'updated'),
                expected: value('updated'),
                operations: (setSubscriber) => [
                  operation({
                    description: 'AND isUpdating is resolved on that target',
                    input: isUpdating(ref('name')),
                    expected: value(false),
                  }),
                  operation({
                    description: 'AND the value of the optimistic variable is requested',
                    input: ref('name'),
                    expected: value('updated'),
                  }),
                  operation({
                    description: 'AND the set() subscription is closed',
                    before() {
                      setSubscriber().subscription.unsubscribe();
                    },
                    operations: [
                      operation({
                        description: 'AND the value of the optimistic variable is requested',
                        input: ref('name'),
                        expected: value('updated'),
                      }),
                    ],
                  }),
                ],
              }),
            ],
          }),
        ],
      }),
      operation({
        description: 'WHEN the optimistic variable is set',
        input: set('name', 'updated'),
        expected: value('updated'),
        operations: (subscriber) => [
          operation({
            description: 'AND isUpdating is resolved on that target',
            input: isUpdating(ref('name')),
            expected: value(false),
          }),
          operation({
            description: 'AND the value of the optimistic variable is requested',
            input: ref('name'),
            expected: value('updated'),
          }),
          operation({
            description: 'AND the set() subscription is closed',
            before() {
              subscriber().subscription.unsubscribe();
            },
            operations: [
              operation({
                description: 'AND the value of the optimistic variable is requested',
                input: ref('name'),
                expected: value('updated'),
              }),
            ],
          }),
        ],
      }),
    ],
  });

  runScenario(() => {
    let asyncNameValue: any;
    let pendingGetPromises: Array<() => void>;
    let pendingSetPromises: Array<() => void>;

    function resolvePendingGets() {
      pendingGetPromises.forEach((resolve) => resolve());
      pendingGetPromises = [];
    }

    function resolvePendingSets() {
      pendingSetPromises.forEach((resolve) => resolve());
      pendingSetPromises = [];
    }

    return {
      description: 'GIVEN a settable fromPromise node wrapped in an optimistic node',
      before() {
        asyncNameValue = 'initial';
        pendingGetPromises = [];
        pendingSetPromises = [];
      },
      graph: () =>
        muster({
          asyncName: optimistic(
            fromPromise({
              get: () =>
                new Promise((resolve) => pendingGetPromises.push(resolve)).then(
                  () => asyncNameValue,
                ),
              set: (params, value) =>
                new Promise((resolve) => pendingSetPromises.push(resolve)).then(() => {
                  asyncNameValue = value;
                  return ok();
                }),
            }),
          ),
        }),
      operations: [
        operation({
          description: 'WHEN the async name is requested',
          input: ifPending(() => value('PENDING'), ref('asyncName')),
          expected: value('PENDING'),
          assert() {
            expect(pendingGetPromises).toHaveLength(1);
          },
          operations: (subscriber) => [
            operation({
              description: 'AND the GET promise is resolved',
              before() {
                jest.clearAllMocks();
                resolvePendingGets();
              },
              assert() {
                expect(subscriber().next).toHaveBeenCalledTimes(1);
                expect(subscriber().next).toHaveBeenCalledWith(value('initial'));
              },
              operations: [
                operation({
                  description: 'AND isUpdating is resolved',
                  input: isUpdating(ref('asyncName')),
                  expected: value(false),
                  operations: (isUpdatingSubscriber) => [
                    operation({
                      description: 'AND the asyncName is set',
                      before() {
                        jest.clearAllMocks();
                      },
                      input: set('asyncName', 'updated'),
                      expected: value('updated'),
                      assert() {
                        expect(pendingSetPromises).toHaveLength(1);
                        expect(subscriber().next).toHaveBeenCalledTimes(1);
                        expect(subscriber().next).toHaveBeenCalledWith(value('updated'));
                        expect(isUpdatingSubscriber().next).toHaveBeenCalledTimes(1);
                        expect(isUpdatingSubscriber().next).toHaveBeenCalledWith(value(true));
                      },
                      operations: (setSubscriber) => [
                        operation({
                          description: 'AND the asyncName set is completed',
                          before() {
                            jest.clearAllMocks();
                            resolvePendingSets();
                          },
                          assert() {
                            expect(subscriber().next).not.toHaveBeenCalled();
                            expect(isUpdatingSubscriber().next).toHaveBeenCalledTimes(1);
                            expect(isUpdatingSubscriber().next).toHaveBeenCalledWith(value(false));
                          },
                          operations: [
                            operation({
                              description:
                                'AND the asyncName is requested after closing all subscriptions',
                              before() {
                                setSubscriber().subscription.unsubscribe();
                                isUpdatingSubscriber().subscription.unsubscribe();
                                subscriber().subscription.unsubscribe();
                              },
                              input: ifPending(() => value('PENDING'), ref('asyncName')),
                              expected: value('PENDING'),
                              operations: (subscriber2) => [
                                operation({
                                  description: 'AND the GET promise is resolved',
                                  before() {
                                    jest.clearAllMocks();
                                    resolvePendingGets();
                                  },
                                  assert() {
                                    expect(subscriber2().next).toHaveBeenCalledTimes(1);
                                    expect(subscriber2().next).toHaveBeenCalledWith(
                                      value('updated'),
                                    );
                                  },
                                }),
                              ],
                            }),
                          ],
                        }),
                      ],
                    }),
                  ],
                }),
              ],
            }),
          ],
        }),
      ],
    };
  });

  runScenario(() => {
    let asyncNameValue: any;
    let pendingGetPromises: Array<() => void>;
    let pendingSetPromises: Array<() => void>;

    function resolvePendingGets() {
      pendingGetPromises.forEach((resolve) => resolve());
      pendingGetPromises = [];
    }

    function resolvePendingSets() {
      pendingSetPromises.forEach((resolve) => resolve());
      pendingSetPromises = [];
    }

    return {
      description: 'GIVEN a settable fromPromise node wrapped in an optimistic node (ERROR)',
      before() {
        asyncNameValue = 'initial';
        pendingGetPromises = [];
        pendingSetPromises = [];
      },
      graph: () =>
        muster({
          asyncName: optimistic(
            fromPromise({
              get: () =>
                new Promise((resolve) => pendingGetPromises.push(resolve)).then(
                  () => asyncNameValue,
                ),
              set: (params, value) =>
                new Promise((resolve) => pendingSetPromises.push(resolve)).then(() =>
                  error('Something went wrong.'),
                ),
            }),
          ),
        }),
      operations: [
        operation({
          description: 'WHEN the asyncName is requested',
          input: ifPending(() => value('PENDING'), ref('asyncName')),
          expected: value('PENDING'),
          assert() {
            expect(pendingGetPromises).toHaveLength(1);
          },
          operations: (subscriber) => [
            operation({
              description: 'AND the async GET is resolved',
              before() {
                jest.clearAllMocks();
                resolvePendingGets();
              },
              assert() {
                expect(subscriber().next).toHaveBeenCalledTimes(1);
                expect(subscriber().next).toHaveBeenCalledWith(value('initial'));
              },
              operations: [
                operation({
                  description: 'AND isUpdating is resolved',
                  input: isUpdating(ref('asyncName')),
                  expected: value(false),
                  operations: (isUpdatingSubscriber) => [
                    operation({
                      description: 'AND the asyncName is set',
                      before() {
                        jest.clearAllMocks();
                      },
                      input: set('asyncName', 'updated'),
                      expected: value('updated'),
                      assert() {
                        expect(subscriber().next).toHaveBeenCalledTimes(1);
                        expect(subscriber().next).toHaveBeenCalledWith(value('updated'));
                        expect(isUpdatingSubscriber().next).toHaveBeenCalledTimes(1);
                        expect(isUpdatingSubscriber().next).toHaveBeenCalledWith(value(true));
                      },
                      operations: (setSubscriber) => [
                        operation({
                          description: 'AND the SET is resolved',
                          before() {
                            jest.clearAllMocks();
                            resolvePendingSets();
                          },
                          assert() {
                            expect(subscriber().next).toHaveBeenCalledTimes(1);
                            expect(subscriber().next).toHaveBeenCalledWith(value('initial'));
                            expect(setSubscriber().next).toHaveBeenCalledTimes(1);
                            expect(setSubscriber().next).toHaveBeenCalledWith(
                              withErrorPath(error('Something went wrong.'), {
                                path: ['asyncName'],
                              }),
                            );
                            expect(isUpdatingSubscriber().next).toHaveBeenCalledTimes(1);
                            expect(isUpdatingSubscriber().next).toHaveBeenCalledWith(value(false));
                          },
                        }),
                      ],
                    }),
                  ],
                }),
              ],
            }),
          ],
        }),
      ],
    };
  });
});
