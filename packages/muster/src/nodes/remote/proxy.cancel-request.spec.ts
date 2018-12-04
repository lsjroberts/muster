import { ObservableLike, Subject } from '@dws/muster-observable';
import muster, {
  entries,
  fromStreamMiddleware,
  Muster,
  NodeDefinition,
  query,
  ref,
  value,
} from '../..';
import { operation, runScenario } from '../../test';
import { proxy } from './proxy';
import { onStreamEmission } from './schedulers/on-stream-emission';

function testProxy(middlewares: Array<NodeDefinition>, trigger: Subject<void>): NodeDefinition {
  return proxy(middlewares, { scheduler: onStreamEmission(trigger) });
}

describe('proxy() - cancelling request', () => {
  describe('GIVEN a remote muster instance with a single leaf', () => {
    let remoteMuster: Muster;
    let mockResolveRemote: jest.Mock<ObservableLike<NodeDefinition>>;
    let trigger: Subject<void>;

    runScenario({
      description: 'AND a local instance connected to the remote',
      before() {
        remoteMuster = muster({
          name: 'Hello world',
        });
        mockResolveRemote = jest.fn((req) => remoteMuster.resolve(req, { raw: true }));
        trigger = new Subject<void>();
      },
      graph: () =>
        muster({
          remote: testProxy([fromStreamMiddleware(mockResolveRemote)], trigger),
        }),
      operations: [
        operation({
          description: 'WHEN a query for a leaf is scheduled',
          before() {
            jest.clearAllMocks();
          },
          input: ref('remote', 'name'),
          assert() {
            expect(mockResolveRemote).not.toHaveBeenCalled();
          },
          operations: (subscriber) => [
            operation({
              description: 'AND the request is sent',
              before() {
                jest.clearAllMocks();
                trigger.next(undefined);
              },
              assert() {
                expect(mockResolveRemote).toHaveBeenCalledTimes(1);
                expect(subscriber().next).toHaveBeenCalledTimes(1);
                expect(subscriber().next).toHaveBeenCalledWith(value('Hello world'));
              },
            }),
            operation({
              description: 'AND the query is cancelled just before sending a request',
              before() {
                jest.clearAllMocks();
                subscriber().subscription.unsubscribe();
                trigger.next(undefined);
              },
              assert() {
                expect(mockResolveRemote).not.toHaveBeenCalled();
              },
            }),
          ],
        }),
      ],
    });
  });

  describe('GIVEN a remote muster instance with a two leaves', () => {
    let remoteMuster: Muster;
    let mockResolveRemote: jest.Mock<ObservableLike<NodeDefinition>>;
    let trigger: Subject<void>;

    runScenario({
      description: 'AND a local instance connected to the remote',
      before() {
        remoteMuster = muster({
          number: 1,
          name: 'Hello world',
        });
        mockResolveRemote = jest.fn((req) => remoteMuster.resolve(req, { raw: true }));
        trigger = new Subject<void>();
      },
      graph: () =>
        muster({
          remote: testProxy([fromStreamMiddleware(mockResolveRemote)], trigger),
        }),
      operations: [
        operation({
          description: 'WHEN the number is requested',
          before() {
            jest.clearAllMocks();
          },
          input: ref('remote', 'number'),
          assert() {
            expect(mockResolveRemote).not.toHaveBeenCalled();
          },
          operations: (subscriber1) => [
            operation({
              description: 'AND the request is resolved',
              before() {
                jest.clearAllMocks();
                trigger.next(undefined);
              },
              assert() {
                expect(mockResolveRemote).toHaveBeenCalledTimes(1);
                expect(subscriber1().next).toHaveBeenCalledTimes(1);
                expect(subscriber1().next).toHaveBeenCalledWith(value(1));
              },
              operations: [
                operation({
                  description: 'AND a query for a name is scheduled (with number subscribed)',
                  before() {
                    jest.clearAllMocks();
                  },
                  input: ref('remote', 'name'),
                  assert() {
                    expect(mockResolveRemote).not.toHaveBeenCalled();
                  },
                  operations: (subscriber2) => [
                    operation({
                      description: 'AND the request is sent',
                      before() {
                        jest.clearAllMocks();
                        trigger.next(undefined);
                      },
                      assert() {
                        expect(mockResolveRemote).toHaveBeenCalledTimes(1);
                        expect(subscriber2().next).toHaveBeenCalledTimes(1);
                        expect(subscriber2().next).toHaveBeenCalledWith(value('Hello world'));
                      },
                    }),
                    operation({
                      description: 'AND the query is cancelled just before sending a request',
                      before() {
                        jest.clearAllMocks();
                        subscriber2().subscription.unsubscribe();
                        trigger.next(undefined);
                      },
                      assert() {
                        expect(mockResolveRemote).not.toHaveBeenCalled();
                      },
                    }),
                  ],
                }),
                operation({
                  description: 'AND a query for a name is scheduled (with number un-subscribed)',
                  before() {
                    jest.clearAllMocks();
                    subscriber1().subscription.unsubscribe();
                  },
                  input: ref('remote', 'name'),
                  assert() {
                    expect(mockResolveRemote).not.toHaveBeenCalled();
                  },
                  operations: (subscriber2) => [
                    operation({
                      description: 'AND the request is sent',
                      before() {
                        jest.clearAllMocks();
                        trigger.next(undefined);
                      },
                      assert() {
                        expect(mockResolveRemote).toHaveBeenCalledTimes(1);
                        expect(subscriber2().next).toHaveBeenCalledTimes(1);
                        expect(subscriber2().next).toHaveBeenCalledWith(value('Hello world'));
                      },
                    }),
                    operation({
                      description: 'AND the query is cancelled just before sending a request',
                      before() {
                        jest.clearAllMocks();
                        subscriber2().subscription.unsubscribe();
                        trigger.next(undefined);
                      },
                      assert() {
                        expect(mockResolveRemote).not.toHaveBeenCalled();
                      },
                    }),
                  ],
                }),
              ],
            }),
          ],
        }),
      ],
    });
  });

  describe('GIVEN a remote muster instance with a nested leaf', () => {
    let remoteMuster: Muster;
    let mockResolveRemote: jest.Mock<ObservableLike<NodeDefinition>>;
    let trigger: Subject<void>;

    runScenario({
      description: 'AND a local instance connected to the remote',
      before() {
        remoteMuster = muster({
          nested: {
            name: 'Hello world',
          },
        });
        mockResolveRemote = jest.fn((req) => remoteMuster.resolve(req, { raw: true }));
        trigger = new Subject<void>();
      },
      graph: () =>
        muster({
          remote: testProxy([fromStreamMiddleware(mockResolveRemote)], trigger),
        }),
      operations: [
        operation({
          description: 'WHEN a query for a leaf is scheduled',
          before() {
            jest.clearAllMocks();
          },
          input: ref('remote', 'nested', 'name'),
          assert() {
            expect(mockResolveRemote).not.toHaveBeenCalled();
          },
          operations: (subscriber) => [
            operation({
              description: 'AND the request is sent',
              before() {
                jest.clearAllMocks();
                trigger.next(undefined);
              },
              assert() {
                expect(mockResolveRemote).toHaveBeenCalledTimes(1);
                expect(subscriber().next).toHaveBeenCalledTimes(1);
                expect(subscriber().next).toHaveBeenCalledWith(value('Hello world'));
              },
            }),
            operation({
              description: 'AND the query is cancelled just before sending a request',
              before() {
                jest.clearAllMocks();
                subscriber().subscription.unsubscribe();
                trigger.next(undefined);
              },
              assert() {
                expect(mockResolveRemote).not.toHaveBeenCalled();
              },
            }),
          ],
        }),
      ],
    });
  });

  describe('GIVEN a remote muster instance with a nested leaf', () => {
    let remoteMuster: Muster;
    let mockResolveRemote: jest.Mock<ObservableLike<NodeDefinition>>;
    let trigger: Subject<void>;

    runScenario({
      description: 'AND a local instance connected to the remote',
      before() {
        remoteMuster = muster({
          nested: {
            number: 1,
            name: 'Hello world',
          },
        });
        mockResolveRemote = jest.fn((req) => remoteMuster.resolve(req, { raw: true }));
        trigger = new Subject<void>();
      },
      graph: () =>
        muster({
          remote: testProxy([fromStreamMiddleware(mockResolveRemote)], trigger),
        }),
      operations: [
        operation({
          description: 'WHEN a query for a number leaf is scheduled',
          before() {
            jest.clearAllMocks();
          },
          input: ref('remote', 'nested', 'number'),
          assert() {
            expect(mockResolveRemote).not.toHaveBeenCalled();
          },
          operations: (subscriber1) => [
            operation({
              description: 'AND the query is resolved',
              before() {
                jest.clearAllMocks();
                trigger.next(undefined);
              },
              assert() {
                expect(mockResolveRemote).toHaveBeenCalledTimes(1);
                expect(subscriber1().next).toHaveBeenCalledTimes(1);
                expect(subscriber1().next).toHaveBeenCalledWith(value(1));
              },
              operations: [
                operation({
                  description:
                    'AND a query for a string leaf is scheduled (with number subscribed)',
                  before() {
                    jest.clearAllMocks();
                  },
                  input: ref('remote', 'nested', 'name'),
                  assert() {
                    expect(mockResolveRemote).not.toHaveBeenCalled();
                  },
                  operations: (subscriber2) => [
                    operation({
                      description: 'AND the request is sent',
                      before() {
                        jest.clearAllMocks();
                        trigger.next(undefined);
                      },
                      assert() {
                        expect(mockResolveRemote).toHaveBeenCalledTimes(1);
                        expect(subscriber2().next).toHaveBeenCalledTimes(1);
                        expect(subscriber2().next).toHaveBeenCalledWith(value('Hello world'));
                      },
                    }),
                    operation({
                      description: 'AND the query is cancelled just before sending a request',
                      before() {
                        jest.clearAllMocks();
                        subscriber2().subscription.unsubscribe();
                        trigger.next(undefined);
                      },
                      assert() {
                        expect(mockResolveRemote).not.toHaveBeenCalled();
                      },
                    }),
                  ],
                }),
                operation({
                  description:
                    'AND a query for a string leaf is scheduled (with number un-subscribed)',
                  before() {
                    jest.clearAllMocks();
                    subscriber1().subscription.unsubscribe();
                  },
                  input: ref('remote', 'nested', 'name'),
                  assert() {
                    expect(mockResolveRemote).not.toHaveBeenCalled();
                  },
                  operations: (subscriber2) => [
                    operation({
                      description: 'AND the request is sent',
                      before() {
                        jest.clearAllMocks();
                        trigger.next(undefined);
                      },
                      assert() {
                        expect(mockResolveRemote).toHaveBeenCalledTimes(1);
                        expect(subscriber2().next).toHaveBeenCalledTimes(1);
                        expect(subscriber2().next).toHaveBeenCalledWith(value('Hello world'));
                      },
                    }),
                    operation({
                      description: 'AND the query is cancelled just before sending a request',
                      before() {
                        jest.clearAllMocks();
                        subscriber2().subscription.unsubscribe();
                        trigger.next(undefined);
                      },
                      assert() {
                        expect(mockResolveRemote).not.toHaveBeenCalled();
                      },
                    }),
                  ],
                }),
              ],
            }),
          ],
        }),
      ],
    });
  });

  describe('GIVEN a remote muster instance with a collection', () => {
    let remoteMuster: Muster;
    let mockResolveRemote: jest.Mock<ObservableLike<NodeDefinition>>;
    let trigger: Subject<void>;

    runScenario({
      description: 'AND a local instance connected to the remote',
      before() {
        remoteMuster = muster({
          numbers: [1, 2],
        });
        mockResolveRemote = jest.fn((req) => remoteMuster.resolve(req, { raw: true }));
        trigger = new Subject<void>();
      },
      graph: () =>
        muster({
          remote: testProxy([fromStreamMiddleware(mockResolveRemote)], trigger),
        }),
      operations: [
        operation({
          description: 'WHEN a query for a collection is scheduled',
          before() {
            jest.clearAllMocks();
          },
          input: query(ref('remote', 'numbers'), entries()),
          assert() {
            expect(mockResolveRemote).not.toHaveBeenCalled();
          },
          operations: (subscriber) => [
            operation({
              description: 'AND the request is sent',
              before() {
                jest.clearAllMocks();
                trigger.next(undefined);
              },
              assert() {
                expect(mockResolveRemote).toHaveBeenCalledTimes(1);
                expect(subscriber().next).toHaveBeenCalledTimes(1);
                expect(subscriber().next).toHaveBeenCalledWith(value([1, 2]));
              },
            }),
            operation({
              description: 'AND the query is cancelled just before sending a request',
              before() {
                jest.clearAllMocks();
                subscriber().subscription.unsubscribe();
                trigger.next(undefined);
              },
              assert() {
                expect(mockResolveRemote).not.toHaveBeenCalled();
              },
            }),
          ],
        }),
      ],
    });
  });

  describe('GIVEN a remote muster instance with a collection and a leaf', () => {
    let remoteMuster: Muster;
    let mockResolveRemote: jest.Mock<ObservableLike<NodeDefinition>>;
    let trigger: Subject<void>;

    runScenario({
      description: 'AND a local instance connected to the remote',
      before() {
        remoteMuster = muster({
          numbers: [1, 2],
          name: 'Hello world',
        });
        mockResolveRemote = jest.fn((req) => remoteMuster.resolve(req, { raw: true }));
        trigger = new Subject<void>();
      },
      graph: () =>
        muster({
          remote: testProxy([fromStreamMiddleware(mockResolveRemote)], trigger),
        }),
      operations: [
        operation({
          description: 'WHEN the query for a name is made',
          input: ref('remote', 'name'),
          assert() {
            expect(mockResolveRemote).not.toHaveBeenCalled();
          },
          operations: (subscriber1) => [
            operation({
              description: 'AND the query resolves',
              before() {
                jest.clearAllMocks();
                trigger.next(undefined);
              },
              assert() {
                expect(mockResolveRemote).toHaveBeenCalledTimes(1);
                expect(subscriber1().next).toHaveBeenCalledTimes(1);
                expect(subscriber1().next).toHaveBeenCalledWith(value('Hello world'));
              },
              operations: [
                operation({
                  description: 'AND a query for a collection is scheduled (with name subscribed)',
                  before() {
                    jest.clearAllMocks();
                  },
                  input: query(ref('remote', 'numbers'), entries()),
                  assert() {
                    expect(mockResolveRemote).not.toHaveBeenCalled();
                  },
                  operations: (subscriber2) => [
                    operation({
                      description: 'AND the request is sent',
                      before() {
                        jest.clearAllMocks();
                        trigger.next(undefined);
                      },
                      assert() {
                        expect(mockResolveRemote).toHaveBeenCalledTimes(1);
                        expect(subscriber2().next).toHaveBeenCalledTimes(1);
                        expect(subscriber2().next).toHaveBeenCalledWith(value([1, 2]));
                      },
                    }),
                    operation({
                      description: 'AND the query is cancelled just before sending a request',
                      before() {
                        jest.clearAllMocks();
                        subscriber2().subscription.unsubscribe();
                        trigger.next(undefined);
                      },
                      assert() {
                        expect(mockResolveRemote).not.toHaveBeenCalled();
                      },
                    }),
                  ],
                }),
                operation({
                  description:
                    'AND a query for a collection is scheduled (with name un-subscribed)',
                  before() {
                    jest.clearAllMocks();
                    subscriber1().subscription.unsubscribe();
                  },
                  input: query(ref('remote', 'numbers'), entries()),
                  assert() {
                    expect(mockResolveRemote).not.toHaveBeenCalled();
                  },
                  operations: (subscriber2) => [
                    operation({
                      description: 'AND the request is sent',
                      before() {
                        jest.clearAllMocks();
                        trigger.next(undefined);
                      },
                      assert() {
                        expect(mockResolveRemote).toHaveBeenCalledTimes(1);
                        expect(subscriber2().next).toHaveBeenCalledTimes(1);
                        expect(subscriber2().next).toHaveBeenCalledWith(value([1, 2]));
                      },
                    }),
                    operation({
                      description: 'AND the query is cancelled just before sending a request',
                      before() {
                        jest.clearAllMocks();
                        subscriber2().subscription.unsubscribe();
                        trigger.next(undefined);
                      },
                      assert() {
                        expect(mockResolveRemote).not.toHaveBeenCalled();
                      },
                    }),
                  ],
                }),
              ],
            }),
          ],
        }),
      ],
    });
  });
});
