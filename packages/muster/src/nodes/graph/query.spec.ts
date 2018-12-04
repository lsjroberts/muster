import muster, {
  action,
  applyTransforms,
  array,
  call,
  catchError,
  computed,
  createCaller,
  createSetter,
  defer,
  DoneNodeType,
  entries,
  error,
  fields,
  filter,
  first,
  fromPromise,
  get,
  getInvalidTypeError,
  includes,
  isPending,
  isQueryNodeDefinition,
  key,
  last,
  length,
  match,
  Muster,
  MusterError,
  nil,
  NodeDefinition,
  NOT_FOUND,
  nth,
  OkNodeType,
  ref,
  relative,
  root,
  set,
  startsWith,
  thenable,
  toNode,
  types,
  value,
  ValueNodeType,
  valueOf,
  variable,
  withErrorPath,
} from '../..';
import { operation, runScenario } from '../../test';
import { query } from './query';

describe('query', () => {
  describe('WHEN checking if a node is an query node', () => {
    describe('AND the node is query node', () => {
      it('SHOULD return true', () => {
        const queryNode = query(root(), fields({}));
        expect(isQueryNodeDefinition(queryNode)).toBe(true);
      });
    });

    describe('AND the node is not query node', () => {
      it('SHOULD return false', () => {
        expect(isQueryNodeDefinition({} as any)).toBe(false);
      });
    });
  });

  runScenario({
    description: 'GIVEN a graph with a value root node',
    graph: () => muster(value('foo')),
    operations: [
      operation({
        description: 'AND a single-level query',
        input: query(
          root(),
          fields({
            item1: key(value('foo')),
            item2: key(value('bar')),
            item3: key(value('baz')),
          }),
        ),
        expected: withErrorPath(
          error(
            getInvalidTypeError('Node does not support getChild operation', {
              expected: 'Node supporting getChild operation',
              received: value('foo'),
            }),
          ),
          { path: [] },
        ),
      }),
      operation({
        description: 'AND a single-level items query',
        input: query(
          root(),
          entries(
            fields({
              item1: key(value('foo')),
              item2: key(value('bar')),
              item3: key(value('baz')),
            }),
          ),
        ),
        expected: withErrorPath(
          error(
            getInvalidTypeError('Node does not support getItems operation', {
              expected: 'Node supporting getItems operation',
              received: value('foo'),
            }),
          ),
          { path: [] },
        ),
      }),
    ],
  });

  runScenario({
    description: 'GIVEN a graph with a branch root node',
    graph: () =>
      muster({
        foo: value('value:foo'),
        bar: value('value:bar'),
        baz: value('value:baz'),
        qux: value('value:qux'),
      }),
    operations: [
      operation({
        description: 'AND an empty query',
        input: query(root(), fields({})),
        expected: value({}),
      }),
      operation({
        description: 'AND a single-level query with shorthand fields',
        input: query(root(), {
          foo: true,
          bar: true,
          baz: true,
        }),
        expected: value({
          foo: 'value:foo',
          bar: 'value:bar',
          baz: 'value:baz',
        }),
      }),
      operation({
        description: 'AND a single-level query',
        input: query(
          root(),
          fields({
            first: key(value('foo')),
            second: key(value('bar')),
            third: key(value('baz')),
          }),
        ),
        expected: value({
          first: 'value:foo',
          second: 'value:bar',
          third: 'value:baz',
        }),
      }),
      operation({
        description: 'AND a single-level query containing invalid paths',
        input: query(
          root(),
          fields({
            first: key(value('foo')),
            second: key(value('bar')),
            third: key(value('asdf')),
          }),
        ),
        expected: withErrorPath(error('Invalid child key: "asdf"', { code: NOT_FOUND }), {
          path: [],
        }),
      }),
      operation({
        description: 'AND a single-level query containing invalid fragment names',
        input: query(
          root(),
          fields({
            first: key(value('foo')),
            second: key(value('bar')),
            third: key(error('error:baz')),
          }),
        ),
        expected: withErrorPath(
          error(
            getInvalidTypeError('Query does not support non-value keys', {
              expected: [ValueNodeType],
              received: error('error:baz'),
            }),
          ),
          { path: [] },
        ),
      }),
    ],
  });

  runScenario({
    description: 'GIVEN a graph with a nested branch root node',
    graph: () =>
      muster({
        foo: value('value:foo'),
        bar: value('value:bar'),
        baz: value('value:baz'),
        qux: value('value:qux'),
        nested: {
          items: {
            a: value('value:a'),
            b: value('value:b'),
            c: value('value:c'),
            d: value('value:d'),
          },
        },
      }),
    operations: [
      operation({
        description: 'AND a nested query',
        input: query(
          root(),
          fields({
            req1: key(value('foo')),
            req2: key(value('bar')),
            req3: key(value('baz')),
            req4: key(value('nested'), {
              req5: key(value('items'), {
                req6: key(value('a')),
                req7: key(value('b')),
                req8: key(value('c')),
              }),
            }),
          }),
        ),
        expected: value({
          req1: 'value:foo',
          req2: 'value:bar',
          req3: 'value:baz',
          req4: {
            req5: {
              req6: 'value:a',
              req7: 'value:b',
              req8: 'value:c',
            },
          },
        }),
      }),
      operation({
        description: 'AND a nested query containing invalid paths',
        input: query(
          root(),
          fields({
            req1: key(value('foo')),
            req2: key(value('bar')),
            req3: key(value('nested'), {
              req4: key(value('items'), {
                req5: key(value('a')),
                req6: key(value('b')),
                req7: key(value('c')),
              }),
            }),
            req8: key(value('missing'), {
              req9: key(value('deep'), {
                req10: key(value('path1')),
                req11: key(value('path2')),
                req12: key(value('path3')),
              }),
            }),
          }),
        ),
        expected: withErrorPath(error('Invalid child key: "missing"', { code: NOT_FOUND }), {
          path: [],
        }),
      }),
      operation({
        description: 'AND a nested query containing error paths',
        input: query(
          root(),
          fields({
            req1: key(value('foo')),
            req2: key(value('bar')),
            req3: key(value('nested'), {
              req4: key(value('items'), {
                req5: key(value('a')),
                req6: key(value('b')),
                req7: key(value('c')),
              }),
              req8: key(error('error:baz')),
            }),
          }),
        ),
        expected: withErrorPath(
          error(
            getInvalidTypeError('Query does not support non-value keys', {
              expected: [ValueNodeType],
              received: error('error:baz'),
            }),
          ),
          { path: [] },
        ),
      }),
      operation({
        description: 'AND a nested query containing invalid fragment names',
        input: query(
          root(),
          fields({
            req1: key(value('foo')),
            req2: key(value('bar')),
            req3: key(error('error:baz')),
          }),
        ),
        expected: withErrorPath(
          error(
            getInvalidTypeError('Query does not support non-value keys', {
              expected: [ValueNodeType],
              received: error('error:baz'),
            }),
          ),
          { path: [] },
        ),
      }),
      operation({
        description: 'AND a query containing a non-nested request for a tree node',
        input: query(
          root(),
          fields({
            req1: key(value('foo')),
            req2: key(value('bar')),
            req3: key(value('nested')),
          }),
        ),
        expected: withErrorPath(error('Invalid query: missing child fields'), { path: [] }),
      }),
    ],
  });

  runScenario({
    description: 'GIVEN a graph with a branch that returns an error',
    graph: () =>
      muster({
        foo: value('value:foo'),
        bar: value('value:bar'),
        baz: value('value:baz'),
        qux: value('value:qux'),
        nested: error('invalid'),
      }),
    operations: [
      operation({
        description: 'AND a nested query containing children of the error branch',
        input: query(
          root(),
          fields({
            test1: key(value('foo')),
            test2: key(value('bar')),
            test3: key(value('baz')),
            test4: key(
              value('nested'),
              fields({
                test5: key(
                  value('items'),
                  fields({
                    test6: key(value('a')),
                    test7: key(value('b')),
                    test8: key(value('c')),
                  }),
                ),
              }),
            ),
          }),
        ),
        expected: withErrorPath(error('invalid'), { path: ['nested'] }),
      }),
    ],
  });

  runScenario({
    description: 'GIVEN a graph with a ref to an error',
    graph: () =>
      muster({
        error: error('Some error'),
        refToError: ref('error'),
      }),
    operations: [
      operation({
        description: 'WHEN making a query to a `refToError`',
        input: query(root(), {
          refToError: key('refToError'),
        }),
        expected: withErrorPath(error('Some error'), { path: ['error'] }),
      }),
    ],
  });

  runScenario({
    description: 'GIVEN a graph with a branch that returns an error wrapped in a value node',
    graph: () =>
      muster({
        foo: value('value:foo'),
        bar: value('value:bar'),
        baz: value('value:baz'),
        qux: value('value:qux'),
        invalid: value(error('invalid')),
      }),
    operations: [
      operation({
        description: 'AND a nested query containing the error branch',
        input: query(
          root(),
          fields({
            a: key(value('foo')),
            b: key(value('bar')),
            c: key(value('baz')),
            d: key(value('invalid')),
          }),
        ),
        expected: value({
          a: 'value:foo',
          b: 'value:bar',
          c: 'value:baz',
          d: error('invalid'),
        }),
      }),
    ],
  });

  function createItemBranch(num: number) {
    return {
      name: value(`Item ${num}`),
      someNumber: value(num + 1),
    };
  }

  runScenario({
    description: 'GIVEN a graph with a branch containing a nested collection',
    graph: () =>
      muster({
        item1: createItemBranch(1),
        item2: createItemBranch(2),
        item3: createItemBranch(3),
        items: array([ref('item1'), ref('item2'), ref('item3')]),
        nested: {
          collection: ref('items'),
        },
      }),
    operations: [
      operation({
        description: 'WHEN requesting a collection as a primitive value',
        input: query(
          root(),
          fields({
            r1: key(value('items')),
          }),
        ),
        expected: withErrorPath(error('Invalid query: missing list item fields'), {
          path: [],
        }),
      }),
      operation({
        description: 'WHEN requesting a collection item branches as primitive values',
        input: query(
          root(),
          fields({
            r1: key(value('items'), entries()),
          }),
        ),
        expected: withErrorPath(error('Invalid query: missing child fields'), { path: ['item1'] }),
      }),
      operation({
        description: 'WHEN requesting collection',
        input: query(
          root(),
          fields({
            r1: key(
              value('nested'),
              fields({
                r2: key(
                  value('collection'),
                  entries({
                    r3: key(value('name')),
                    r4: key(value('someNumber')),
                  }),
                ),
              }),
            ),
          }),
        ),
        expected: value({
          r1: {
            r2: [
              {
                r3: 'Item 1',
                r4: 2,
              },
              {
                r3: 'Item 2',
                r4: 3,
              },
              {
                r3: 'Item 3',
                r4: 4,
              },
            ],
          },
        }),
      }),
    ],
  });

  runScenario({
    description: 'GIVEN a graph with deeply nested collections',
    graph: () =>
      muster({
        deeply: [
          {
            nested: [
              { items: [{ id: '1.1.1' }, { id: '1.1.2' }, { id: '1.1.3' }] },
              { items: [{ id: '1.2.1' }, { id: '1.2.2' }, { id: '1.2.3' }] },
              { items: [{ id: '1.3.1' }, { id: '1.3.2' }, { id: '1.3.3' }] },
            ],
          },
          {
            nested: [
              { items: [{ id: '2.1.1' }, { id: '2.1.2' }, { id: '2.1.3' }] },
              { items: [{ id: '2.2.1' }, { id: '2.2.2' }, { id: '2.2.3' }] },
              { items: [{ id: '2.3.1' }, { id: '2.3.2' }, { id: '2.3.3' }] },
            ],
          },
        ],
      }),
    operations: [
      operation({
        description: 'WHEN requesting nested collection items with intermediate nodes',
        input: query(
          root(),
          fields({
            deeply: key(
              'deeply',
              entries(
                fields({
                  nested: key(
                    'nested',
                    entries(
                      fields({
                        items: key(
                          'items',
                          entries(
                            fields({
                              id: key('id'),
                            }),
                          ),
                        ),
                      }),
                    ),
                  ),
                }),
              ),
            ),
          }),
        ),
        expected: value({
          deeply: [
            {
              nested: [
                { items: [{ id: '1.1.1' }, { id: '1.1.2' }, { id: '1.1.3' }] },
                { items: [{ id: '1.2.1' }, { id: '1.2.2' }, { id: '1.2.3' }] },
                { items: [{ id: '1.3.1' }, { id: '1.3.2' }, { id: '1.3.3' }] },
              ],
            },
            {
              nested: [
                { items: [{ id: '2.1.1' }, { id: '2.1.2' }, { id: '2.1.3' }] },
                { items: [{ id: '2.2.1' }, { id: '2.2.2' }, { id: '2.2.3' }] },
                { items: [{ id: '2.3.1' }, { id: '2.3.2' }, { id: '2.3.3' }] },
              ],
            },
          ],
        }),
      }),
    ],
  });

  runScenario({
    description: 'GIVEN a graph with deeply nested collections with no intermediate nodes',
    graph: () =>
      muster({
        items: [
          [
            [{ id: '1.1.1' }, { id: '1.1.2' }, { id: '1.1.3' }],
            [{ id: '1.2.1' }, { id: '1.2.2' }, { id: '1.2.3' }],
            [{ id: '1.3.1' }, { id: '1.3.2' }, { id: '1.3.3' }],
          ],
          [
            [{ id: '2.1.1' }, { id: '2.1.2' }, { id: '2.1.3' }],
            [{ id: '2.2.1' }, { id: '2.2.2' }, { id: '2.2.3' }],
            [{ id: '2.3.1' }, { id: '2.3.2' }, { id: '2.3.3' }],
          ],
        ],
      }),
    operations: [
      operation({
        description: 'WHEN requesting nested collection items',
        input: query(
          root(),
          fields({
            items: key(
              'items',
              entries(
                entries(
                  entries(
                    fields({
                      id: key('id'),
                    }),
                  ),
                ),
              ),
            ),
          }),
        ),
        expected: value({
          items: [
            [
              [{ id: '1.1.1' }, { id: '1.1.2' }, { id: '1.1.3' }],
              [{ id: '1.2.1' }, { id: '1.2.2' }, { id: '1.2.3' }],
              [{ id: '1.3.1' }, { id: '1.3.2' }, { id: '1.3.3' }],
            ],
            [
              [{ id: '2.1.1' }, { id: '2.1.2' }, { id: '2.1.3' }],
              [{ id: '2.2.1' }, { id: '2.2.2' }, { id: '2.2.3' }],
              [{ id: '2.3.1' }, { id: '2.3.2' }, { id: '2.3.3' }],
            ],
          ],
        }),
      }),
    ],
  });

  runScenario({
    description: 'GIVEN a collection and various transforms',
    graph: () =>
      muster({
        items: ['foo', 'bar', 'baz'],
        filteredItems: applyTransforms(ref('items'), [
          filter((item: NodeDefinition) => startsWith('b', item)),
        ]),
        firstItem: get(ref('items'), first()),
        secondItem: get(ref('items'), nth(1)),
        lastItem: get(ref('items'), last()),
        numItems: get(ref('items'), length()),
        numFilteredItems: get(ref('filteredItems'), length()),
      }),
    operations: [
      operation({
        description: 'AND a query requests multiple transformed versions of the collection',
        input: query(root(), {
          items: entries(),
          filteredItems: entries(),
          firstItem: true,
          secondItem: true,
          lastItem: true,
          numItems: true,
          numFilteredItems: true,
        }),
        expected: value({
          items: ['foo', 'bar', 'baz'],
          filteredItems: ['bar', 'baz'],
          firstItem: 'foo',
          secondItem: 'bar',
          lastItem: 'baz',
          numItems: 3,
          numFilteredItems: 2,
        }),
      }),
    ],
  });

  describe('GIVEN a graph with values, variables and actions', () => {
    let app: Muster;
    let testError: Error;
    beforeEach(() => {
      app = muster({
        readOnlyValue: value('Static value'),
        variable: variable('Dynamic value'),
        testAction: action((arg1: number, arg2: number) => arg1 + arg2),
        errorAction: action(() => {
          throw (testError = new Error('error:foo'));
        }),
      });
    });

    describe('WHEN requesting the getters, setters and callers from the graph', () => {
      let queryResult: any;
      beforeEach(async () => {
        queryResult = valueOf(
          await thenable(
            app.resolve(
              query(
                root(),
                fields({
                  value: key('readOnlyValue'),
                  variable: key('variable'),
                  setVariable: createSetter('variable'),
                  callTestAction: createCaller('testAction'),
                }),
              ),
              { raw: true },
            ),
          ),
        );
      });

      it('SHOULD return correct value', () => {
        expect(queryResult).toEqual({
          value: 'Static value',
          variable: 'Dynamic value',
          setVariable: expect.any(Function),
          callTestAction: expect.any(Function),
        });
      });

      describe('AND then calling the returned createSetter', () => {
        let setResult: any;
        beforeEach(async () => {
          const setVariable = queryResult.setVariable;
          setResult = await setVariable('Modified dynamic value');
        });

        it('SHOULD return correct value', () => {
          expect(setResult).toEqual('Modified dynamic value');
        });

        describe('AND then requesting the updated variable out of the graph', () => {
          let updatedVariableResult: NodeDefinition;
          beforeEach(async () => {
            updatedVariableResult = await thenable(app.resolve(ref('variable'), { raw: true }));
          });

          it('SHOULD return correct updated value', () => {
            expect(updatedVariableResult).toEqual(value('Modified dynamic value'));
          });
        });
      });

      describe('AND then calling the returned createCaller', () => {
        let callResult: any;
        beforeEach(async () => {
          const callTestAction = queryResult.callTestAction;
          callResult = await callTestAction(5, 2);
        });

        it('SHOULD return correct value', () => {
          expect(callResult).toEqual(7);
        });
      });
    });

    describe('WHEN requesting a caller that throws an error', () => {
      let queryResult: any;
      beforeEach(async () => {
        queryResult = valueOf(
          await thenable(
            app.resolve(
              query(
                root(),
                fields({
                  callErrorAction: createCaller('errorAction'),
                }),
              ),
              { raw: true },
            ),
          ),
        );
      });

      it('SHOULD return correct value', () => {
        expect(queryResult).toEqual({
          callErrorAction: expect.any(Function),
        });
      });

      describe('AND the caller is called', () => {
        let error: any;
        let result: any;
        beforeEach(() => {
          return queryResult
            .callErrorAction()
            .then((val: any) => {
              result = val;
            })
            .catch((e: any) => {
              error = e;
            });
        });

        it('SHOULD throw an error', () => {
          expect(result).toBe(undefined);
          expect(error).toEqual(
            new MusterError(testError, {
              code: undefined,
              data: undefined,
              path: undefined,
              remotePath: undefined,
            }),
          );
          expect(error.error).toBe(testError);
          expect(error.code).toBe(undefined);
          expect(error.data).toBe(undefined);
          expect(error.path).toBe(undefined);
          expect(error.remotePath).toBe(undefined);
        });
      });
    });

    describe('WHEN requesting a setter that throws an error', () => {
      let queryResult: any;
      beforeEach(async () => {
        queryResult = valueOf(
          await thenable(
            app.resolve(
              query(
                root(),
                fields({
                  setErrorSetter: createSetter('nonexistent'),
                }),
              ),
              { raw: true },
            ),
          ),
        );
      });

      it('SHOULD return correct value', () => {
        expect(queryResult).toEqual({
          setErrorSetter: expect.any(Function),
        });
      });

      describe('AND the setter is called', () => {
        let error: any;
        let result: any;
        beforeEach(() => {
          return queryResult
            .setErrorSetter('value:foo')
            .then((val: any) => {
              result = val;
            })
            .catch((e: any) => {
              error = e;
            });
        });

        it('SHOULD throw an error', () => {
          expect(result).toBe(undefined);
          expect(error).toEqual(
            new MusterError(new Error('Invalid child key: "nonexistent"'), {
              code: 'NOT_FOUND',
              data: undefined,
              path: undefined,
              remotePath: undefined,
            }),
          );
          expect(error.error).toEqual(new Error('Invalid child key: "nonexistent"'));
          expect(error.code).toBe('NOT_FOUND');
          expect(error.data).toBe(undefined);
          expect(error.path).toBe(undefined);
          expect(error.remotePath).toBe(undefined);
        });
      });
    });
  });

  describe('GIVEN a graph with an asynchronous action', () => {
    let app: Muster;
    beforeEach(() => {
      app = muster({
        testAction: action(function*() {
          const result = yield fromPromise(() => Promise.resolve(value('foo')));
          return `Result: ${result}`;
        }),
      });
    });

    describe('WHEN requesting the getters, setters and callers from the graph', () => {
      let queryResult: any;
      beforeEach(async () => {
        queryResult = valueOf(
          await thenable(
            app.resolve(
              query(
                root(),
                fields({
                  testAction: createCaller('testAction'),
                }),
              ),
              { raw: true },
            ),
          ),
        );
      });

      it('SHOULD return correct value', () => {
        expect(queryResult).toEqual({
          testAction: expect.any(Function),
        });
      });

      describe('AND then calling the returned action', () => {
        it('SHOULD return correct value', async () => {
          expect(await queryResult.testAction()).toEqual('Result: foo');
        });
      });
    });
  });

  runScenario({
    description: 'GIVEN a graph with a branch containing a nil node',
    graph: () =>
      muster({
        myCollection: nil(),
      }),
    operations: [
      operation({
        description: 'WHEN making a query to the nil collection for items',
        input: query(
          root(),
          fields({
            myCollection: key('myCollection', entries()),
          }),
        ),
        expected: value({
          myCollection: [],
        }),
      }),
    ],
  });

  runScenario({
    description: 'GIVEN a muster graph containing a variable and an action in a branch',
    graph: () =>
      muster({
        nested: {
          foo: variable('foo'),
          getFoo: action(() => ref(relative('foo'))),
          setFoo: action(() => set(relative('foo'), 'bar')),
        },
      }),
    operations: [
      operation({
        description: 'WHEN the variable gets set',
        input: set(['nested', 'foo'], 'bar'),
        expected: value('bar'),
        operations: [
          operation({
            description: 'AND getting a createCaller for `getFoo`',
            input: query(root(), {
              nested: key('nested', {
                getFoo: createCaller('getFoo'),
              }),
            }),
            operations: (subscriber, results) => [
              operation({
                description: 'AND the returned createCaller gets called',
                input: fromPromise(() => valueOf(results()[0]).nested.getFoo()),
                expected: value('bar'),
              }),
            ],
          }),
          operation({
            description: 'AND the `getFoo` gets called',
            input: call(['nested', 'getFoo']),
            expected: value('bar'),
          }),
        ],
      }),
      operation({
        description: 'WHEN getting a createCaller for `setFoo`',
        input: query(root(), {
          nested: key('nested', {
            setFoo: createCaller('setFoo'),
          }),
        }),
        operations: (subscriber, results) => [
          operation({
            description: 'AND the `setFoo` gets called',
            input: fromPromise(() => valueOf(results()[0]).nested.setFoo()),
            expected: value('bar'),
            operations: [
              operation({
                description: 'WHEN calling `getFoo`',
                input: ref('nested', 'foo'),
                expected: value('bar'),
              }),
            ],
          }),
        ],
      }),
    ],
  });

  runScenario(() => {
    let promisesToResolve: Array<() => void>;

    function resolvePromises() {
      promisesToResolve.forEach((resolve) => resolve());
      promisesToResolve = [];
    }

    return {
      description: 'GIVEN a muster graph containing async nodes',
      before() {
        promisesToResolve = [];
      },
      graph: () =>
        muster({
          name: variable('initial'),
          asyncName: computed([ref('name')], (name) => ref(name)),
          [match(types.string, 'name')]: fromPromise(({ name }) =>
            new Promise((res) => promisesToResolve.push(res)).then(() => name),
          ),
        }),
      operations: [
        operation({
          description: 'WHEN making a query to muster for deferred async node',
          input: query(root(), {
            asyncName: defer('asyncName'),
            isLoadingAsyncName: isPending('asyncName'),
          }),
          expected: value({
            asyncName: undefined,
            isLoadingAsyncName: true,
          }),
          operations: (subscriber) => [
            operation({
              description: 'AND the initial promise resolves',
              before() {
                jest.clearAllMocks();
                resolvePromises();
              },
              assert() {
                expect(subscriber().next).toHaveBeenCalledTimes(1);
                expect(subscriber().next).toHaveBeenCalledWith(
                  value({
                    asyncName: 'initial',
                    isLoadingAsyncName: false,
                  }),
                );
              },
              operations: [
                operation({
                  description: 'AND the name changes',
                  before() {
                    jest.clearAllMocks();
                  },
                  input: set('name', 'updated'),
                  assert() {
                    expect(subscriber().next).toHaveBeenCalledTimes(1);
                    expect(subscriber().next).toHaveBeenCalledWith(
                      value({
                        asyncName: 'initial',
                        isLoadingAsyncName: true,
                      }),
                    );
                  },
                  operations: [
                    operation({
                      description: 'AND the promise resolves',
                      before() {
                        jest.clearAllMocks();
                        resolvePromises();
                      },
                      assert() {
                        expect(subscriber().next).toHaveBeenCalledTimes(1);
                        expect(subscriber().next).toHaveBeenCalledWith(
                          value({
                            asyncName: 'updated',
                            isLoadingAsyncName: false,
                          }),
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
    };
  });

  runScenario({
    description: 'GIVEN a muster graph containing a value node and a nil node',
    graph: () =>
      muster({
        name: 'Bob',
        other: nil(),
      }),
    operations: [
      operation({
        description: 'WHEN making a query for the value node and the nil node',
        input: query(root(), {
          name: key('name'),
          other: key('other'),
        }),
        expected: value({
          name: 'Bob',
          other: undefined,
        }),
      }),
      operation({
        description: 'WHEN making a query for the value node and deeply nested children of the nil',
        input: query(root(), {
          name: key('name'),
          other: key(
            'other',
            fields({
              deeply: key(
                'deeply',
                fields({
                  nested: key('nested'),
                }),
              ),
            }),
          ),
        }),
        expected: value({
          name: 'Bob',
          other: {
            deeply: {
              nested: undefined,
            },
          },
        }),
      }),
    ],
  });

  runScenario(() => {
    let promisesToResolve: Array<() => void>;

    function resolvePromises() {
      promisesToResolve.forEach((resolve) => resolve());
    }
    return {
      description: 'GIVEN an asynchronous branch',
      before() {
        promisesToResolve = [];
      },
      graph: () =>
        muster({
          user: fromPromise(() =>
            new Promise((resolve) => promisesToResolve.push(resolve)).then(() =>
              toNode({
                firstName: 'Bob',
                lastName: 'Smith',
              }),
            ),
          ),
        }),
      operations: [
        operation({
          description: 'WHEN making a deferred query with a fallback',
          input: query(root(), {
            user: defer(
              value('Loading...'),
              key('user', {
                firstName: key('firstName'),
                lastName: key('lastName'),
              }),
            ),
          }),
          expected: value({
            user: 'Loading...',
          }),
          operations: (subscriber) => [
            operation({
              description: 'AND the promise resolves',
              before() {
                jest.clearAllMocks();
                resolvePromises();
              },
              assert() {
                expect(subscriber().next).toHaveBeenCalledTimes(1);
                expect(subscriber().next).toHaveBeenCalledWith(
                  value({
                    user: {
                      firstName: 'Bob',
                      lastName: 'Smith',
                    },
                  }),
                );
              },
            }),
          ],
        }),
      ],
    };
  });

  runScenario({
    description: 'GIVEN a leaf that resolves to an error',
    graph: () =>
      muster({
        name: error('Test error'),
      }),
    operations: [
      operation({
        description: 'WHEN making a query to get the leaf with fallback',
        input: query(root(), {
          name: catchError(value('some fallback value'), 'name'),
        }),
        expected: value({
          name: 'some fallback value',
        }),
      }),
    ],
  });

  runScenario({
    description: 'GIVEN a branch that resolves to an error',
    graph: () =>
      muster({
        user: error('test error'),
      }),
    operations: [
      operation({
        description: 'WHEN making a query to get the branch with fallback',
        input: query(root(), {
          user: catchError(value('some fallback user'), {
            firstName: key('firstName'),
            lastName: key('lastName'),
          }),
        }),
        expected: value({
          user: 'some fallback user',
        }),
      }),
    ],
  });

  runScenario({
    description: 'GIVEN a graph containing a nested tree',
    graph: () =>
      muster({
        user: {
          age: 25,
          firstName: 'Bob',
          lastName: 'Smith',
          fullName: computed(
            [ref(relative('firstName')), ref(relative('lastName'))],
            (firstName, lastName) => `${firstName} ${lastName}`,
          ),
        },
      }),
    operations: [
      operation({
        description: 'WHEN the query is made using a short-hand syntax',
        input: query(root(), {
          user: {
            age: true,
            fullName: true,
          },
        }),
        expected: value({
          user: {
            age: 25,
            fullName: 'Bob Smith',
          },
        }),
      }),
    ],
  });

  runScenario({
    description: 'GIVEN a graph containing a nested tree',
    graph: () =>
      muster({
        user: {
          name: 'Bob',
        },
      }),
    operations: [
      operation({
        description: 'WHEN making a query to get the tree as a leaf',
        input: query(root(), {
          user: true,
        }),
        expected: withErrorPath(error('Invalid query: missing child fields'), { path: [] }),
      }),
    ],
  });

  runScenario({
    description: 'GIVEN a graph containing a collection',
    graph: () =>
      muster({
        numbers: [1, 2, 3],
      }),
    operations: [
      operation({
        description: 'WHEN making a short-hand query to get these items',
        input: query(root(), {
          numbers: entries(),
        }),
        expected: value({
          numbers: [1, 2, 3],
        }),
      }),
    ],
  });

  runScenario({
    description: 'GIVEN a graph containing a collection of people filtered by first name',
    graph: () =>
      muster({
        filteredPeople: applyTransforms(
          [
            { firstName: 'Bob', lastName: 'Smith' },
            { firstName: 'Kate', lastName: 'Doe' },
            { firstName: 'Jane', lastName: 'Jonson' },
          ],
          [filter((person: any) => includes('a', get(person, 'firstName')))],
        ),
      }),
    operations: [
      operation({
        description: 'WHEN a query to get filtered people is made',
        input: query(
          ref('filteredPeople'),
          entries({
            firstName: true,
          }),
        ),
        expected: value([{ firstName: 'Kate' }, { firstName: 'Jane' }]),
      }),
    ],
  });

  runScenario({
    description: 'GIVEN a computed node that depends on a tree() node',
    graph: () =>
      muster({
        user: {
          firstName: 'Bob',
          lastName: 'Smith',
        },
        fullName: computed([ref('user')], (user) => `${user.firstName} ${user.lastName}`),
      }),
    operations: [
      operation({
        description: 'WHEN a query is made to get the full name',
        input: query(root(), {
          fullName: true,
        }),
        expected: withErrorPath(
          error(
            getInvalidTypeError('Invalid computed node dependencies', {
              expected: [ValueNodeType, OkNodeType, DoneNodeType],
              received: toNode({
                firstName: 'Bob',
                lastName: 'Smith',
              }),
            }),
          ),
          { path: ['user'] },
        ),
      }),
    ],
  });
});
