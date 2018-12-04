import muster, {
  defer,
  error,
  get,
  ifPending,
  key,
  match,
  Muster,
  nil,
  NodeDefinition,
  NodeLike,
  ok,
  OkNodeDefinition,
  Params,
  query,
  ref,
  reset,
  root,
  set,
  toNode,
  types,
  value,
} from '../..';
import runScenario, { operation } from '../../test/run-scenario';
import { withErrorPath } from './error';
import { fromPromise } from './from-promise';
import { invalidate } from './invalidate';

describe('fromPromise()', () => {
  describe('eval', () => {
    let evalResolvers: Array<(result: any) => void>;

    runScenario({
      description: 'GIVEN a graph with a fromPromise node at the root',
      before() {
        evalResolvers = [];
      },
      graph: () =>
        muster(
          fromPromise(
            () =>
              new Promise((resolve) => {
                evalResolvers.push(resolve);
              }),
          ),
        ),
      operations: [
        operation({
          description: 'AND a subscription to the root',
          input: ifPending(value('PENDING'), ref()),
          expected: value('PENDING'),
          operations: (evalSub) => [
            operation({
              description: 'WHEN the eval resolves',
              before() {
                jest.clearAllMocks();
                evalResolvers[0](value('ABC'));
              },
              assert() {
                expect(evalSub().next).toHaveBeenCalledTimes(1);
                expect(evalSub().next).toHaveBeenLastCalledWith(value('ABC'));
              },
            }),
          ],
        }),
      ],
    });
  });

  describe('eval -> set -> set-resolve -> eval-resolve', () => {
    let setResolvers: Array<(result: any) => void>;
    let evalResolvers: Array<(result: any) => void>;

    runScenario({
      description: 'GIVEN a graph with a fromPromise node at the root',
      before() {
        setResolvers = [];
        evalResolvers = [];
      },
      graph: () =>
        muster(
          fromPromise({
            get: () =>
              new Promise((resolve) => {
                evalResolvers.push(resolve);
              }),
            set: (params, newValue) =>
              new Promise((resolve) => {
                setResolvers.push(resolve);
              }),
          }),
        ),
      operations: [
        operation({
          description: 'AND a subscription to the root',
          input: ifPending(() => value('PENDING'), ref()),
          expected: value('PENDING'),
          operations: (evalSub) => [
            operation({
              description: 'WHEN setting to 123',
              before() {
                jest.clearAllMocks();
              },
              input: ifPending(value('PENDING'), set(ref(), value(123))),
              assert() {
                expect(setResolvers).toHaveLength(1);
                expect(evalSub().next).toHaveBeenCalledTimes(0);
              },
              operations: (setSub) => [
                operation({
                  description: 'AND the set resolves',
                  before() {
                    jest.clearAllMocks();
                    setResolvers[0](ok());
                  },
                  assert() {
                    expect(evalSub().next).toHaveBeenCalledTimes(1);
                    expect(evalSub().next).toHaveBeenLastCalledWith(value(123));
                    expect(setSub().next).toHaveBeenCalledTimes(1);
                    expect(setSub().next).toHaveBeenLastCalledWith(value(123));
                  },
                  operations: [
                    operation({
                      description: 'AND the eval resolves',
                      before() {
                        jest.clearAllMocks();
                        evalResolvers[0](value('ABC'));
                      },
                      assert() {
                        // Resolving the eval promise should not cause a second output
                        // from the evalSub, as the set promise, which was more recent,
                        // has resolved.
                        expect(evalSub().next).not.toHaveBeenCalled();
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

  describe('eval -> set -> eval-resolve -> set-resolve', () => {
    let setResolvers: Array<(result: any) => void>;
    let evalResolvers: Array<(result: any) => void>;

    runScenario({
      description: 'GIVEN a graph with a fromPromise node at the root',
      before() {
        setResolvers = [];
        evalResolvers = [];
      },
      graph: () =>
        muster(
          fromPromise({
            get: () =>
              new Promise((resolve) => {
                evalResolvers.push(resolve);
              }),
            set: (params, newValue) =>
              new Promise((resolve) => {
                setResolvers.push(resolve);
              }),
          }),
        ),
      operations: [
        operation({
          description: 'AND a subscription to the root',
          input: ifPending(value('PENDING'), ref()),
          expected: value('PENDING'),
          operations: (evalSub) => [
            operation({
              description: 'WHEN setting to 123',
              input: ifPending(value('PENDING'), set(ref(), value(123))),
              expected: value('PENDING'),
              operations: (setSub) => [
                operation({
                  description: 'AND the eval promise resolves',
                  before() {
                    jest.clearAllMocks();
                    evalResolvers[0](value(234));
                  },
                  assert() {
                    expect(setSub().next).not.toHaveBeenCalled();
                    expect(evalSub().next).not.toHaveBeenCalled();
                  },
                  operations: [
                    operation({
                      description: 'AND the set promise resolves',
                      before() {
                        jest.clearAllMocks();
                        setResolvers[0](ok());
                      },
                      assert() {
                        expect(setSub().next).toHaveBeenCalledTimes(1);
                        expect(setSub().next).toHaveBeenLastCalledWith(value(123));
                        expect(evalSub().next).toHaveBeenCalledTimes(1);
                        expect(evalSub().next).toHaveBeenLastCalledWith(value(123));
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

  describe('set -> eval -> set-resolve -> eval-resolve', () => {
    let setResolvers: Array<(result: any) => void>;
    let evalResolvers: Array<(result: any) => void>;

    runScenario({
      description: 'GIVEN a graph with a fromPromise node at the root',
      before() {
        setResolvers = [];
        evalResolvers = [];
      },
      graph: () =>
        muster(
          fromPromise({
            get: () =>
              new Promise((resolve) => {
                evalResolvers.push(resolve);
              }),
            set: (params, newValue) =>
              new Promise((resolve) => {
                setResolvers.push(resolve);
              }),
          }),
        ),
      operations: [
        operation({
          description: 'WHEN setting to 123',
          input: ifPending(value('PENDING'), set(ref(), value(123))),
          expected: value('PENDING'),
          operations: (setSub) => [
            operation({
              description: 'WHEN evaluating the root',
              input: ifPending(value('PENDING'), ref()),
              expected: value('PENDING'),
              assert() {
                expect(evalResolvers).toHaveLength(0);
              },
              operations: (evalSub) => [
                operation({
                  description: 'AND the set resolves',
                  before() {
                    jest.clearAllMocks();
                    setResolvers[0](ok());
                  },
                  assert() {
                    expect(evalSub().next).toHaveBeenCalledTimes(1);
                    expect(evalSub().next).toHaveBeenLastCalledWith(value(123));
                    expect(setSub().next).toHaveBeenCalledTimes(1);
                    expect(setSub().next).toHaveBeenLastCalledWith(value(123));
                  },
                }),
              ],
            }),
          ],
        }),
      ],
    });
  });

  describe('set -> eval -> eval-resolve -> set-resolve', () => {
    let setResolvers: Array<(result: any) => void>;
    let evalResolvers: Array<(result: any) => void>;

    runScenario({
      description: 'GIVEN a graph with a fromPromise node at the root',
      before() {
        setResolvers = [];
        evalResolvers = [];
      },
      graph: () =>
        muster(
          fromPromise({
            get: () =>
              new Promise((resolve) => {
                evalResolvers.push(resolve);
              }),
            set: (params, newValue) =>
              new Promise((resolve) => {
                setResolvers.push(resolve);
              }),
          }),
        ),
      operations: [
        operation({
          description: 'WHEN setting to 123',
          input: ifPending(value('PENDING'), set(ref(), value(123))),
          expected: value('PENDING'),
          operations: (setSub) => [
            operation({
              description: 'WHEN evaluating the root',
              input: ifPending(value('PENDING'), ref()),
              expected: value('PENDING'),
              assert() {
                expect(evalResolvers).toHaveLength(0);
              },
              operations: (evalSub) => [
                operation({
                  description: 'AND the set resolves',
                  before() {
                    jest.clearAllMocks();
                    setResolvers[0](ok());
                  },
                  assert() {
                    expect(evalSub().next).toHaveBeenCalledTimes(1);
                    expect(evalSub().next).toHaveBeenLastCalledWith(value(123));
                    expect(setSub().next).toHaveBeenCalledTimes(1);
                    expect(setSub().next).toHaveBeenLastCalledWith(value(123));
                  },
                }),
              ],
            }),
          ],
        }),
      ],
    });
  });

  describe('set-1 -> set-2 -> eval -> eval-resolve -> set-1-resolve -> set-2-resolve', () => {
    let setResolvers: Array<(result: any) => void>;
    let evalResolvers: Array<(result: any) => void>;

    runScenario({
      description: 'GIVEN a graph with a fromPromise node at the root',
      before() {
        setResolvers = [];
        evalResolvers = [];
      },
      graph: () =>
        muster(
          fromPromise({
            get: () =>
              new Promise((resolve) => {
                evalResolvers.push(resolve);
              }),
            set: (params, newValue) =>
              new Promise((resolve) => {
                setResolvers.push(resolve);
              }),
          }),
        ),
      operations: [
        operation({
          description: 'WHEN first setting to 123',
          input: ifPending(value('PENDING'), set(ref(), value(123))),
          expected: value('PENDING'),
          operations: (set1Sub) => [
            operation({
              description: 'AND then setting to 234',
              input: ifPending(value('PENDING'), set(ref(), value(234))),
              expected: value('PENDING'),
              operations: (set2Sub) => [
                operation({
                  description: 'AND then evaluating the root',
                  input: ifPending(value('PENDING'), ref()),
                  expected: value('PENDING'),
                  operations: (evalSub) => [
                    operation({
                      description: 'AND set 1 resolves',
                      before() {
                        jest.clearAllMocks();
                        setResolvers[0](ok());
                      },
                      assert() {
                        expect(set1Sub().next).not.toHaveBeenCalled();
                        expect(set2Sub().next).not.toHaveBeenCalled();
                        expect(evalSub().next).not.toHaveBeenCalled();
                      },
                      operations: [
                        operation({
                          description: 'AND the second set resolves',
                          before() {
                            jest.clearAllMocks();
                            setResolvers[1](ok());
                          },
                          assert() {
                            expect(set1Sub().next).toHaveBeenCalledTimes(1);
                            expect(set1Sub().next).toHaveBeenLastCalledWith(value(123));
                            expect(set2Sub().next).toHaveBeenCalledTimes(1);
                            expect(set2Sub().next).toHaveBeenLastCalledWith(value(234));
                            expect(evalSub().next).toHaveBeenCalledTimes(1);
                            expect(evalSub().next).toHaveBeenLastCalledWith(value(234));
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
    });
  });

  describe('set-1 -> set-2 -> eval -> eval-resolve -> set-2-resolve -> set-1-resolve', () => {
    let setResolvers: Array<(result: any) => void>;
    let evalResolvers: Array<(result: any) => void>;

    runScenario({
      description: 'GIVEN a graph with a fromPromise node at the root',
      before() {
        setResolvers = [];
        evalResolvers = [];
      },
      graph: () =>
        muster(
          fromPromise({
            get: () =>
              new Promise((resolve) => {
                evalResolvers.push(resolve);
              }),
            set: (params, newValue) =>
              new Promise((resolve) => {
                setResolvers.push(resolve);
              }),
          }),
        ),
      operations: [
        operation({
          description: 'WHEN first setting to 123',
          input: ifPending(value('PENDING'), set(ref(), value(123))),
          expected: value('PENDING'),
          operations: (set1Sub) => [
            operation({
              description: 'AND then setting to 234',
              input: ifPending(value('PENDING'), set(ref(), value(234))),
              expected: value('PENDING'),
              operations: (set2Sub) => [
                operation({
                  description: 'AND then evaluating the root',
                  input: ifPending(value('PENDING'), ref()),
                  expected: value('PENDING'),
                  assert() {
                    expect(evalResolvers).toHaveLength(0);
                  },
                  operations: (evalSub) => [
                    operation({
                      description: 'AND the second set resolves',
                      before() {
                        jest.clearAllMocks();
                        setResolvers[1](ok());
                      },
                      assert() {
                        expect(set1Sub().next).toHaveBeenCalledTimes(1);
                        expect(set1Sub().next).toHaveBeenCalledWith(value(123));
                        expect(set2Sub().next).toHaveBeenCalledTimes(1);
                        expect(set2Sub().next).toHaveBeenCalledWith(value(234));
                        expect(evalSub().next).toHaveBeenCalledTimes(1);
                        expect(evalSub().next).toHaveBeenCalledWith(value(234));
                      },
                      operations: [
                        operation({
                          description: 'AND the first set resolves',
                          before() {
                            jest.clearAllMocks();
                            setResolvers[0](ok());
                          },
                          assert() {
                            expect(set1Sub().next).not.toHaveBeenCalled();
                            expect(set2Sub().next).not.toHaveBeenCalled();
                            expect(evalSub().next).not.toHaveBeenCalled();
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
    });
  });

  describe('set-1 -> eval -> set-2 -> set-1-resolve -> set-2-resolve -> eval-resolve', () => {
    let setResolvers: Array<(result: any) => void>;
    let evalResolvers: Array<(result: any) => void>;

    runScenario({
      description: 'GIVEN a graph with a fromPromise node at the root',
      before() {
        setResolvers = [];
        evalResolvers = [];
      },
      graph: () =>
        muster(
          fromPromise({
            get: () =>
              new Promise((resolve) => {
                evalResolvers.push(resolve);
              }),
            set: (params, newValue) =>
              new Promise((resolve) => {
                setResolvers.push(resolve);
              }),
          }),
        ),
      operations: [
        operation({
          description: 'WHEN first setting to 123',
          input: ifPending(value('PENDING'), set(ref(), value(123))),
          expected: value('PENDING'),
          operations: (set1Sub) => [
            operation({
              description: 'AND then evaluating the root',
              input: ifPending(value('PENDING'), ref()),
              expected: value('PENDING'),
              assert() {
                expect(evalResolvers).toHaveLength(0);
              },
              operations: (evalSub) => [
                operation({
                  description: 'AND then setting to 234',
                  input: ifPending(value('PENDING'), set(ref(), value(234))),
                  expected: value('PENDING'),
                  operations: (set2Sub) => [
                    operation({
                      description: 'AND the first set resolves',
                      before() {
                        jest.clearAllMocks();
                        setResolvers[0](ok());
                      },
                      assert() {
                        expect(set1Sub().next).not.toHaveBeenCalled();
                        expect(set2Sub().next).not.toHaveBeenCalled();
                        expect(evalSub().next).not.toHaveBeenCalled();
                      },
                      operations: [
                        operation({
                          description: 'AND the second set resolves',
                          before() {
                            jest.clearAllMocks();
                            setResolvers[1](ok());
                          },
                          assert() {
                            expect(set1Sub().next).toHaveBeenCalledTimes(1);
                            expect(set1Sub().next).toHaveBeenCalledWith(value(123));
                            expect(set2Sub().next).toHaveBeenCalledTimes(1);
                            expect(set2Sub().next).toHaveBeenCalledWith(value(234));
                            expect(evalSub().next).toHaveBeenCalledTimes(1);
                            expect(evalSub().next).toHaveBeenCalledWith(value(234));
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
    });
  });

  describe('set-1 -> eval -> eval-resolve -> set-2 -> set-2-resolve -> set-1-resolve', () => {
    let setResolvers: Array<(result: any) => void>;
    let evalResolvers: Array<(result: any) => void>;

    runScenario({
      description: 'GIVEN a graph with a fromPromise node at the root',
      before() {
        setResolvers = [];
        evalResolvers = [];
      },
      graph: () =>
        muster(
          fromPromise({
            get: () =>
              new Promise((resolve) => {
                evalResolvers.push(resolve);
              }),
            set: (params, newValue) =>
              new Promise((resolve) => {
                setResolvers.push(resolve);
              }),
          }),
        ),
      operations: [
        operation({
          description: 'WHEN first setting to 123',
          input: ifPending(value('PENDING'), set(ref(), value(123))),
          expected: value('PENDING'),
          operations: (set1Sub) => [
            operation({
              description: 'AND then evaluating the root',
              input: ifPending(value('PENDING'), ref()),
              expected: value('PENDING'),
              assert() {
                expect(evalResolvers).toHaveLength(0);
              },
              operations: (evalSub) => [
                operation({
                  description: 'AND then setting to 234',
                  input: ifPending(value('PENDING'), set(ref(), value(234))),
                  expected: value('PENDING'),
                  operations: (set2Sub) => [
                    operation({
                      description: 'AND the second set resolves',
                      before() {
                        jest.clearAllMocks();
                        setResolvers[1](ok());
                      },
                      assert() {
                        expect(evalSub().next).toHaveBeenCalledTimes(1);
                        expect(evalSub().next).toHaveBeenCalledWith(value(234));
                        expect(set1Sub().next).toHaveBeenCalledTimes(1);
                        expect(set1Sub().next).toHaveBeenCalledWith(value(123));
                        expect(set2Sub().next).toHaveBeenCalledTimes(1);
                        expect(set2Sub().next).toHaveBeenCalledWith(value(234));
                      },
                      operations: [
                        operation({
                          description: 'AND the first set resolves',
                          before() {
                            jest.clearAllMocks();
                            setResolvers[0](ok());
                          },
                          assert() {
                            expect(evalSub().next).not.toHaveBeenCalled();
                            expect(set1Sub().next).not.toHaveBeenCalled();
                            expect(set2Sub().next).not.toHaveBeenCalled();
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
    });
  });

  describe('eval -> set-1 -> set-2 -> eval-reject -> set-1-resolve -> set-2-reject', () => {
    let setResolvers: Array<(result: any) => void>;
    let setRejecters: Array<(result: any) => void>;
    let evalResolvers: Array<(result: any) => void>;
    let evalRejecters: Array<(result: any) => void>;

    runScenario({
      description: 'GIVEN a graph with a fromPromise node at the root',
      before() {
        setResolvers = [];
        setRejecters = [];
        evalResolvers = [];
        evalRejecters = [];
      },
      graph: () =>
        muster(
          fromPromise({
            get: () =>
              new Promise((resolve, reject) => {
                evalResolvers.push(resolve);
                evalRejecters.push(reject);
              }),
            set: (params, newValue) =>
              new Promise((resolve, reject) => {
                setResolvers.push(resolve);
                setRejecters.push(reject);
              }),
          }),
        ),
      operations: [
        operation({
          description: 'WHEN first evaluating the root',
          input: ifPending(value('PENDING'), ref()),
          expected: value('PENDING'),
          assert() {
            expect(evalResolvers).toHaveLength(1);
          },
          operations: (evalSub) => [
            operation({
              description: 'AND then setting to 123',
              before() {
                jest.clearAllMocks();
              },
              input: ifPending(value('PENDING'), set(ref(), value(123))),
              expected: value('PENDING'),
              assert() {
                expect(evalSub().next).not.toHaveBeenCalled();
              },
              operations: (set1Sub) => [
                operation({
                  description: 'AND then setting to 234',
                  before() {
                    jest.clearAllMocks();
                  },
                  input: ifPending(value('PENDING'), set(ref(), value(234))),
                  expected: value('PENDING'),
                  assert() {
                    expect(evalSub().next).toHaveBeenCalledTimes(0);
                  },
                  operations: (set2Sub) => [
                    operation({
                      description: 'AND the eval rejects',
                      before() {
                        jest.clearAllMocks();
                        evalRejecters[0](new Error('INVALID TOKEN'));
                      },
                      assert() {
                        expect(evalSub().next).not.toHaveBeenCalled();
                        expect(set1Sub().next).not.toHaveBeenCalled();
                        expect(set2Sub().next).not.toHaveBeenCalled();
                      },
                      operations: [
                        operation({
                          description: 'AND set 1 resolves',
                          before() {
                            jest.clearAllMocks();
                            setResolvers[0](ok());
                          },
                          assert() {
                            expect(evalSub().next).not.toHaveBeenCalled();
                            expect(set1Sub().next).not.toHaveBeenCalled();
                            expect(set2Sub().next).not.toHaveBeenCalled();
                          },
                          operations: [
                            operation({
                              description: 'AND set 2 rejects',
                              before() {
                                jest.clearAllMocks();
                                setRejecters[1](new Error('SET FAILURE'));
                              },
                              assert() {
                                expect(set1Sub().next).toHaveBeenCalledTimes(1);
                                expect(set1Sub().next).toHaveBeenLastCalledWith(
                                  withErrorPath(
                                    error('SET FAILURE'),
                                    // FIXME: Remove the `remotePath` - bug in if-pending
                                    { path: [], remotePath: [] },
                                  ),
                                );
                                expect(set2Sub().next).toHaveBeenCalledTimes(1);
                                expect(set2Sub().next).toHaveBeenLastCalledWith(
                                  withErrorPath(
                                    error('SET FAILURE'),
                                    // FIXME: Remove the `remotePath` - bug in if-pending
                                    { path: [], remotePath: [] },
                                  ),
                                );
                                expect(evalSub().next).not.toHaveBeenCalled();
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
    });
  });

  describe('eval -> set-1 -> set-2 -> eval-resolve -> set-2-reject -> set-1-resolve', () => {
    let setResolvers: Array<(result: any) => void>;
    let setRejecters: Array<(result: any) => void>;
    let evalResolvers: Array<(result: any) => void>;
    let evalRejecters: Array<(result: any) => void>;

    runScenario({
      description: 'GIVEN a graph with a fromPromise node at the root',
      before() {
        setResolvers = [];
        setRejecters = [];
        evalResolvers = [];
        evalRejecters = [];
      },
      graph: () =>
        muster(
          fromPromise({
            get: () =>
              new Promise((resolve, reject) => {
                evalResolvers.push(resolve);
                evalRejecters.push(reject);
              }),
            set: (params, newValue) =>
              new Promise((resolve, reject) => {
                setResolvers.push(resolve);
                setRejecters.push(reject);
              }),
          }),
        ),
      operations: [
        operation({
          description: 'WHEN first evaluating the root',
          input: ifPending(value('PENDING'), ref()),
          expected: value('PENDING'),
          operations: (evalSub) => [
            operation({
              description: 'AND then setting to 123',
              before() {
                jest.clearAllMocks();
              },
              input: ifPending(value('PENDING'), set(ref(), value(123))),
              expected: value('PENDING'),
              assert() {
                expect(evalSub().next).toHaveBeenCalledTimes(0);
              },
              operations: (set1Sub) => [
                operation({
                  description: 'AND then setting to 234',
                  before() {
                    jest.clearAllMocks();
                  },
                  input: ifPending(value('PENDING'), set(ref(), value(234))),
                  expected: value('PENDING'),
                  assert() {
                    expect(evalSub().next).toHaveBeenCalledTimes(0);
                  },
                  operations: (set2Sub) => [
                    operation({
                      description: 'AND the eval resolves',
                      before() {
                        jest.clearAllMocks();
                        evalResolvers[0](value('ABC'));
                      },
                      assert() {
                        expect(evalSub().next).not.toHaveBeenCalled();
                        expect(set1Sub().next).not.toHaveBeenCalled();
                        expect(set2Sub().next).not.toHaveBeenCalled();
                      },
                      operations: [
                        operation({
                          description: 'AND set 2 rejects',
                          before() {
                            jest.clearAllMocks();
                            setRejecters[1](new Error('SET FAILURE'));
                          },
                          assert() {
                            expect(set1Sub().next).toHaveBeenCalledTimes(1);
                            expect(set1Sub().next).toHaveBeenLastCalledWith(
                              withErrorPath(
                                error('SET FAILURE'),
                                // FIXME: Remove the `remotePath` - bug in if-pending
                                { path: [], remotePath: [] },
                              ),
                            );
                            expect(set2Sub().next).toHaveBeenCalledTimes(1);
                            expect(set2Sub().next).toHaveBeenLastCalledWith(
                              withErrorPath(
                                error('SET FAILURE'),
                                // FIXME: Remove the `remotePath` - bug in if-pending
                                { path: [], remotePath: [] },
                              ),
                            );
                            expect(evalSub().next).not.toHaveBeenCalled();
                          },
                          operations: [
                            operation({
                              description: 'AND set 1 resolves',
                              before() {
                                jest.clearAllMocks();
                                setResolvers[0](ok());
                              },
                              assert() {
                                expect(evalSub().next).not.toHaveBeenCalled();
                                expect(set1Sub().next).not.toHaveBeenCalled();
                                expect(set2Sub().next).not.toHaveBeenCalled();
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
    });
  });

  describe('eval -> set -> set-reject -> eval-resolve', () => {
    let setResolvers: Array<(result: any) => void>;
    let setRejecters: Array<(result: any) => void>;
    let evalResolvers: Array<(result: any) => void>;
    let evalRejecters: Array<(result: any) => void>;

    runScenario({
      description: 'GIVEN a graph with a fromPromise node at the root',
      before() {
        setResolvers = [];
        setRejecters = [];
        evalResolvers = [];
        evalRejecters = [];
      },
      graph: () =>
        muster(
          fromPromise({
            get: () =>
              new Promise((resolve, reject) => {
                evalResolvers.push(resolve);
                evalRejecters.push(reject);
              }),
            set: (params, newValue) =>
              new Promise((resolve, reject) => {
                setResolvers.push(resolve);
                setRejecters.push(reject);
              }),
          }),
        ),
      operations: [
        operation({
          description: 'WHEN first evaluating the root',
          input: ifPending(value('PENDING'), ref()),
          expected: value('PENDING'),
          operations: (evalSub) => [
            operation({
              description: 'AND then setting to 123',
              before() {
                jest.clearAllMocks();
              },
              input: ifPending(value('PENDING'), set(ref(), value(123))),
              expected: value('PENDING'),
              assert() {
                expect(evalSub().next).toHaveBeenCalledTimes(0);
              },
              operations: (set1Sub) => [
                operation({
                  description: 'AND the set rejects',
                  before() {
                    jest.clearAllMocks();
                    setRejecters[0](new Error('SET FAILURE'));
                  },
                  assert() {
                    expect(set1Sub().next).toHaveBeenCalledTimes(1);
                    expect(set1Sub().next).toHaveBeenLastCalledWith(
                      withErrorPath(
                        error('SET FAILURE'),
                        // FIXME: Remove the `remotePath` - bug in if-pending
                        { path: [], remotePath: [] },
                      ),
                    );
                  },
                  operations: [
                    operation({
                      description: 'AND the eval resolves',
                      before() {
                        jest.clearAllMocks();
                        evalResolvers[0](value('ABC'));
                      },
                      assert() {
                        expect(evalSub().next).not.toHaveBeenCalled();
                        expect(set1Sub().next).not.toHaveBeenCalled();
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

  runScenario({
    description: 'GIVEN a muster graph with a from promise node that returns an incorrect node',
    graph: () =>
      muster({
        invalidNode: fromPromise(() => Promise.resolve({ $type: 'troll' })),
      }),
    operations: [
      operation({
        description: 'AND the invalid node gets requested',
        input: ref('invalidNode'),
        expected: value({ $type: 'troll' }),
      }),
    ],
  });

  describe('GIVEN a muster graph with a sync and an async nodes', () => {
    let app: Muster;
    beforeEach(() => {
      app = muster({
        name: 'sync name',
        asyncName: fromPromise(() => Promise.resolve('async name')),
      });
    });

    describe('WHEN a query is made to get a name and an async name', () => {
      let subscriber: jest.Mock<NodeDefinition>;
      beforeEach(() => {
        subscriber = jest.fn();
        app
          .resolve(
            query(root(), {
              name: key('name'),
              asyncName: defer('asyncName'),
            }),
            { raw: true },
          )
          .subscribe(subscriber);
      });

      it('SHOULD return correct response', () => {
        expect(subscriber).toHaveBeenCalledTimes(2);
        expect(subscriber).toHaveBeenCalledWith(
          value({
            name: 'sync name',
            asyncName: undefined,
          }),
        );
        expect(subscriber).toHaveBeenLastCalledWith(
          value({
            name: 'sync name',
            asyncName: 'async name',
          }),
        );
      });
    });
  });

  let resolvePromise: () => void;
  runScenario({
    description: 'GIVEN a muster graph with an async and a sync nodes',
    graph: () =>
      muster({
        name: 'sync name',
        asyncName: fromPromise(() =>
          new Promise((res) => (resolvePromise = res)).then(() => 'async name'),
        ),
      }),
    operations: [
      operation({
        description: 'WHEN the query is made for sync and async names',
        input: query(root(), {
          name: key('name'),
          asyncName: defer('asyncName'),
        }),
        expected: value({
          name: 'sync name',
          asyncName: undefined,
        }),
        operations: (subscriber) => [
          operation({
            description: 'AND the promise resolves',
            before() {
              jest.clearAllMocks();
              resolvePromise();
            },
            assert() {
              expect(subscriber().next).toHaveBeenCalledTimes(1);
              expect(subscriber().next).toHaveBeenCalledWith(
                value({
                  name: 'sync name',
                  asyncName: 'async name',
                }),
              );
            },
          }),
        ],
      }),
    ],
  });
});

describe('fromPromise', () => {
  runScenario(() => {
    const getter = jest.fn<Promise<NodeDefinition>>((params: Params) =>
      Promise.resolve(value('foo')),
    );
    return {
      description: 'GIVEN a graph with a read-only fromPromise node with no path params',
      graph: () => muster(fromPromise(getter)),
      operations: [
        operation({
          description: 'AND the node is retrieved',
          input: root(),
          expected: value('foo'),
          before() {
            jest.clearAllMocks();
          },
          assert() {
            expect(getter).toHaveBeenCalledTimes(1);
            expect(getter).toHaveBeenCalledWith({});
          },
        }),
        operation({
          description: 'AND the node is updated',
          input: set(root(), value('bar')),
          expected: withErrorPath(error('Specified fromPromise node is read-only'), { path: [] }),
          before() {
            jest.clearAllMocks();
          },
          assert() {
            expect(getter).toHaveBeenCalledTimes(0);
          },
        }),
      ],
    };
  });

  runScenario(() => {
    const setter = jest.fn<Promise<OkNodeDefinition>>((params: Params, value: any) =>
      Promise.resolve(ok()),
    );
    return {
      description: 'GIVEN a graph with a write-only fromPromise node with no path params',
      graph: () =>
        muster(
          fromPromise({
            set: setter,
          }),
        ),
      operations: [
        operation({
          description: 'AND the node is retrieved',
          input: root(),
          expected: withErrorPath(error('Specified fromPromise node is write-only'), { path: [] }),
          before() {
            jest.clearAllMocks();
          },
          assert() {
            expect(setter).toHaveBeenCalledTimes(0);
          },
        }),
        operation({
          description: 'AND the node is updated',
          input: set(root(), value('bar')),
          expected: value('bar'),
          before() {
            jest.clearAllMocks();
          },
          assert() {
            expect(setter).toHaveBeenCalledTimes(1);
            expect(setter).toHaveBeenCalledWith({}, 'bar');
          },
        }),
      ],
    };
  });

  runScenario(() => {
    const getter = jest.fn<Promise<NodeDefinition>>((params: Params) =>
      Promise.resolve(value('foo')),
    );
    const setter = jest.fn<Promise<OkNodeDefinition>>((params: Params, value: any) =>
      Promise.resolve(ok()),
    );
    return {
      description: 'GIVEN a graph with a read/write fromPromise node with no path params',
      graph: () => muster(fromPromise({ get: getter, set: setter })),
      operations: [
        operation({
          description: 'AND the node is retrieved',
          input: root(),
          expected: value('foo'),
          before() {
            jest.clearAllMocks();
          },
          assert() {
            expect(getter).toHaveBeenCalledTimes(1);
            expect(getter).toHaveBeenCalledWith({});
            expect(setter).toHaveBeenCalledTimes(0);
          },
          operations: (subscriber) => [
            operation({
              description: 'AND the node is updated',
              input: set(root(), value('bar')),
              expected: value('bar'),
              before() {
                jest.clearAllMocks();
              },
              assert() {
                expect(setter).toHaveBeenCalledTimes(1);
                expect(setter).toHaveBeenCalledWith({}, 'bar');
                expect(getter).toHaveBeenCalledTimes(0);
                expect(subscriber().next).toHaveBeenCalledTimes(1);
                expect(subscriber().next).toHaveBeenCalledWith(value('bar'));
              },
              operations: [
                operation({
                  description: 'AND the subscription is closed',
                  before() {
                    subscriber().subscription.unsubscribe();
                  },
                  operations: [
                    operation({
                      description: 'AND another subscription is created',
                      input: root(),
                      expected: value('bar'),
                      before() {
                        jest.clearAllMocks();
                      },
                      assert() {
                        expect(getter).toHaveBeenCalledTimes(0);
                        expect(setter).toHaveBeenCalledTimes(0);
                      },
                    }),
                  ],
                }),
                operation({
                  description: 'AND the value is reset',
                  input: reset(root()),
                  expected: ok(),
                  before() {
                    jest.clearAllMocks();
                  },
                  assert() {
                    expect(getter).toHaveBeenCalledTimes(1);
                    expect(getter).toHaveBeenCalledWith({});
                    expect(setter).toHaveBeenCalledTimes(0);
                    expect(subscriber().next).toHaveBeenCalledTimes(1);
                    expect(subscriber().next).toHaveBeenCalledWith(value('foo'));
                  },
                }),
              ],
            }),
          ],
        }),
        operation({
          description: 'AND the node is updated',
          input: set(root(), value('bar')),
          expected: value('bar'),
          before() {
            jest.clearAllMocks();
          },
          assert() {
            expect(setter).toHaveBeenCalledTimes(1);
            expect(setter).toHaveBeenCalledWith({}, 'bar');
            expect(getter).toHaveBeenCalledTimes(0);
          },
          operations: [
            operation({
              description: 'AND the node is retrieved',
              input: root(),
              expected: value('bar'),
              before() {
                jest.clearAllMocks();
              },
              assert() {
                expect(getter).toHaveBeenCalledTimes(0);
                expect(setter).toHaveBeenCalledTimes(0);
              },
              operations: (subscriber) => [
                operation({
                  description: 'AND the subscription is closed',
                  before() {
                    subscriber().subscription.unsubscribe();
                  },
                  operations: [
                    operation({
                      description: 'AND another subscription is created',
                      input: root(),
                      expected: value('bar'),
                      before() {
                        jest.clearAllMocks();
                      },
                      assert() {
                        expect(getter).toHaveBeenCalledTimes(0);
                        expect(setter).toHaveBeenCalledTimes(0);
                      },
                    }),
                  ],
                }),
              ],
            }),
            operation({
              description: 'AND the value is reset',
              input: reset(root()),
              expected: ok(),
              before() {
                jest.clearAllMocks();
              },
              assert() {
                expect(getter).toHaveBeenCalledTimes(0);
                expect(setter).toHaveBeenCalledTimes(0);
              },
              operations: [
                operation({
                  description: 'AND the node is retrieved',
                  input: root(),
                  expected: value('foo'),
                  before() {
                    jest.clearAllMocks();
                  },
                  assert() {
                    expect(getter).toHaveBeenCalledTimes(1);
                    expect(getter).toHaveBeenCalledWith({});
                    expect(setter).toHaveBeenCalledTimes(0);
                  },
                }),
              ],
            }),
          ],
        }),
        operation({
          description: 'AND the value is reset',
          input: reset(root()),
          expected: ok(),
          before() {
            jest.clearAllMocks();
          },
          assert() {
            expect(getter).toHaveBeenCalledTimes(0);
            expect(setter).toHaveBeenCalledTimes(0);
          },
        }),
      ],
    };
  });

  runScenario(() => {
    const getter = jest.fn<Promise<NodeDefinition>>((params: Params) =>
      Promise.resolve(value('foo')),
    );
    const setter = jest.fn<Promise<OkNodeDefinition>>((params: Params, value: any) =>
      Promise.resolve(ok()),
    );
    return {
      description: 'GIVEN a graph with a read/write fromPromise node nested below path params',
      graph: () =>
        muster(
          toNode({
            [match(types.string, 'param1')]: {
              [match(types.string, 'param2')]: fromPromise({ get: getter, set: setter }),
            },
          }),
        ),
      operations: [
        operation({
          description: 'AND the node is retrieved',
          input: get(get(root(), value('one')), value('two')),
          expected: value('foo'),
          before() {
            jest.clearAllMocks();
          },
          assert() {
            expect(getter).toHaveBeenCalledTimes(1);
            expect(getter).toHaveBeenCalledWith({ param1: 'one', param2: 'two' });
            expect(setter).toHaveBeenCalledTimes(0);
          },
        }),
        operation({
          description: 'AND the node is updated',
          input: set(get(get(root(), value('one')), value('two')), value('bar')),
          expected: value('bar'),
          before() {
            jest.clearAllMocks();
          },
          assert() {
            expect(setter).toHaveBeenCalledTimes(1);
            expect(setter).toHaveBeenCalledWith({ param1: 'one', param2: 'two' }, 'bar');
            expect(getter).toHaveBeenCalledTimes(0);
          },
        }),
      ],
    };
  });

  runScenario(() => {
    const rawGetter = jest.fn<Promise<NodeLike>>((params: Params) => Promise.resolve('foo'));
    const okGetter = jest.fn<Promise<NodeLike>>((params: Params) => Promise.resolve(ok()));
    const errorGetter = jest.fn<Promise<NodeLike>>((params: Params) =>
      Promise.resolve(error('foo')),
    );
    const throwGetter = jest.fn<Promise<NodeLike>>((params: Params) => {
      throw new Error('foo');
    });
    const rejectGetter = jest.fn<Promise<NodeLike>>((params: Params) =>
      Promise.reject(new Error('foo')),
    );
    return {
      description: 'GIVEN an empty graph',
      graph: () => muster(nil()),
      operations: [
        operation({
          description: 'AND a fromPromise node that returns a raw value is retrieved',
          input: fromPromise(rawGetter),
          expected: value('foo'),
        }),
        operation({
          description: 'AND a fromPromise node that returns a non-value node is retrieved',
          input: fromPromise(okGetter),
          expected: ok(),
        }),
        operation({
          description: 'AND a fromPromise node that throws an error is retrieved',
          input: fromPromise(errorGetter),
          expected: withErrorPath(error('foo'), { path: [] }),
        }),
        operation({
          description: 'AND a fromPromise node that throws an error is retrieved',
          input: fromPromise(throwGetter),
          expected: withErrorPath(error('foo'), { path: [] }),
        }),
        operation({
          description: 'AND a fromPromise node that rejects with an error is retrieved',
          input: fromPromise(rejectGetter),
          expected: withErrorPath(error('foo'), { path: [] }),
        }),
      ],
    };
  });

  let counter: number;
  runScenario({
    description: 'GIVEN a muster graph containing a fromPromise node',
    before() {
      counter = 0;
    },
    graph: () =>
      muster({
        async: fromPromise(() => {
          // tslint:disable-next-line:no-increment-decrement
          return Promise.resolve(++counter);
        }),
      }),
    operations: [
      operation({
        description: 'WHEN requesting async for the first time',
        input: ref('async'),
        expected: value(1),
        operations: [
          operation({
            description: 'AND the async gets requested for the second time',
            input: ref('async'),
            expected: value(1),
          }),
        ],
      }),
    ],
  });

  let name: string;
  runScenario({
    description: 'GIVEN a muster graph containing a settable fromPromise node',
    before() {
      name = 'initial';
    },
    graph: () =>
      muster({
        name: fromPromise(
          () => Promise.resolve(name),
          (params: any, val: any) => {
            name = val;
            return Promise.resolve(ok());
          },
        ),
      }),
    operations: [
      operation({
        description: 'WHEN requesting the name',
        input: ref('name'),
        expected: value('initial'),
        operations: (subscriber) => [
          operation({
            description: 'AND then setting it to a new value',
            before() {
              jest.clearAllMocks();
            },
            input: set('name', 'updated'),
            expected: value('updated'),
            async assert() {
              await new Promise((resolve) => setTimeout(resolve, 0));
              expect(subscriber().next).toHaveBeenCalledTimes(1);
            },
          }),
        ],
      }),
    ],
  });

  runScenario({
    description: 'GIVEN a muster graph containing a rejected promise',
    graph: () =>
      muster({
        name: fromPromise(() => Promise.reject('Test reason')),
      }),
    operations: [
      operation({
        description: 'WHEN the value of the promise is requested',
        input: ref('name'),
        expected: withErrorPath(error('Test reason'), { path: ['name'] }),
      }),
    ],
  });

  runScenario(() => {
    let mockGet: jest.Mock<NodeDefinition>;
    return {
      description: 'GIVEN a fromPromise that returns a value node',
      before() {
        mockGet = jest.fn(() => value('Hello world'));
      },
      graph: () =>
        muster({
          name: fromPromise(mockGet),
        }),
      operations: [
        operation({
          description: 'WHEN the name is requested',
          before() {
            jest.clearAllMocks();
          },
          input: ref('name'),
          expected: value('Hello world'),
          assert() {
            expect(mockGet).toHaveBeenCalledTimes(1);
          },
          operations: (subscriber) => [
            operation({
              description: 'AND then the name is invalidated',
              before() {
                jest.clearAllMocks();
              },
              input: invalidate(ref('name')),
              assert() {
                expect(subscriber().next).not.toHaveBeenCalled();
                expect(mockGet).toHaveBeenCalledTimes(1);
              },
            }),
          ],
        }),
      ],
    };
  });

  runScenario(() => {
    let mockGet: jest.Mock<NodeDefinition>;
    return {
      description: 'GIVEN a fromPromise that returns a tree',
      before() {
        mockGet = jest.fn(() =>
          toNode({
            firstName: 'Bob',
            lastName: 'Doe',
          }),
        );
      },
      graph: () =>
        muster({
          user: fromPromise(mockGet),
        }),
      operations: [
        operation({
          description: 'WHEN the a query for first name is made',
          before() {
            jest.clearAllMocks();
          },
          input: query(root(), {
            user: {
              firstName: true,
            },
          }),
          expected: value({
            user: {
              firstName: 'Bob',
            },
          }),
          assert() {
            expect(mockGet).toHaveBeenCalledTimes(1);
          },
          operations: (subscriber) => [
            operation({
              description: 'AND then the name is invalidated',
              before() {
                jest.clearAllMocks();
              },
              input: invalidate(ref('user')),
              assert() {
                expect(mockGet).toHaveBeenCalledTimes(1);
                expect(subscriber().next).not.toHaveBeenCalled();
              },
            }),
          ],
        }),
      ],
    };
  });
});
