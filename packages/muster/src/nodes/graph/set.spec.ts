import muster, {
  action,
  apply,
  call,
  computed,
  error,
  invalidateOn,
  Muster,
  ref,
  root,
  toNode,
  value,
  variable,
} from '../..';
import { operation, runScenario } from '../../test';
import { withErrorPath } from './error';
import { isSetNodeDefinition, set } from './set';

describe('set', () => {
  describe('SetNodeType', () => {
    describe('WHEN calling `.is`', () => {
      describe('AND it is valid', () => {
        it('SHOULD return true', () => {
          expect(isSetNodeDefinition(set(ref('foo', 'bar'), value(123)))).toBe(true);
        });
      });

      describe('AND it is not valid', () => {
        it('SHOULD return false', () => {
          expect(isSetNodeDefinition(root())).toBe(false);
        });
      });
    });
  });

  describe('integration', () => {
    runScenario({
      description: 'GIVEN a ref to a settable node',
      graph: () =>
        muster({
          foo: variable('bar'),
        }),
      operations: [
        operation({
          description: 'AND the variable is retrieved',
          input: ref('foo'),
          expected: value('bar'),
          operations: (subscriber) => [
            operation({
              description: 'AND the variable is updated',
              before: () => {
                jest.clearAllMocks();
              },
              input: set(ref('foo'), 'baz'),
              expected: value('baz'),
              assert: () => {
                expect(subscriber().next).toHaveBeenCalledTimes(1);
                expect(subscriber().next).toHaveBeenCalledWith(value('baz'));
              },
            }),
          ],
        }),
      ],
    });

    runScenario({
      description: 'GIVEN a ref to a ref to a settable node',
      graph: () =>
        muster({
          foo: variable('bar'),
          baz: ref('foo'),
        }),
      operations: [
        operation({
          description: 'AND the variable is retrieved',
          input: ref('foo'),
          expected: value('bar'),
          operations: (subscriber) => [
            operation({
              description: 'AND the variable is updated',
              before: () => {
                jest.clearAllMocks();
              },
              input: set(ref('baz'), 'qux'),
              expected: value('qux'),
              assert: () => {
                expect(subscriber().next).toHaveBeenCalledTimes(1);
                expect(subscriber().next).toHaveBeenCalledWith(value('qux'));
              },
            }),
          ],
        }),
      ],
    });

    runScenario({
      description: 'GIVEN a non-settable node',
      graph: () =>
        muster({
          foo: value(123),
        }),
      operations: [
        operation({
          description: 'SHOULD error with correct message',
          input: set(ref('foo'), value(456)),
          expected: withErrorPath(
            error(['Target node is not settable', ' Received:', '  value(123)'].join('\n')),
            { path: ['foo'] },
          ),
        }),
      ],
    });

    runScenario({
      description: 'GIVEN a variable and an action node which is calling a set on that variable',
      graph: () =>
        muster({
          name: variable('initial name'),
          setName: action(function*(newName) {
            yield set(ref('name'), newName);
            return yield ref('name');
          }),
        }),
      operations: [
        operation({
          description: 'WHEN calling the setName path',
          input: apply(['new name'], ref('setName')),
          expected: value('new name'),
        }),
      ],
    });

    describe('GIVEN a muster graph containing a variable with a default value', () => {
      let app: Muster;
      const TEST_EVENT = '$event:Test';

      beforeEach(() => {
        app = muster({
          positions: invalidateOn(
            TEST_EVENT,
            toNode({
              standard: {
                items: variable(value([1])),
              },
              testUser: {
                addItem: action(function*(item) {
                  const existingItems = yield ref('positions', 'standard', 'items');
                  return yield set(ref('positions', 'standard', 'items'), [...existingItems, item]);
                }),
                computedItems: computed([ref('positions', 'standard', 'items')], (val) =>
                  toNode({
                    items: value(val),
                  }),
                ),
              },
            }),
          ),
        });
      });

      describe('WHEN requesting the initial value of the variable', () => {
        it('SHOULD return correct initial value', async () => {
          const result = await app.resolve(ref('positions', 'testUser', 'computedItems', 'items'), {
            raw: true,
          });
          expect(result).toEqual(value([1]));
        });
      });

      describe('WHEN the variable gets changed', () => {
        beforeEach(async () => {
          const result = await app.resolve(
            call(ref('positions', 'testUser', 'addItem'), [value(2)]),
            { raw: true },
          );
          expect(result).toEqual(value([1, 2]));
        });

        it('SHOULD return correct updated value', async () => {
          const result = await app.resolve(ref('positions', 'testUser', 'computedItems', 'items'), {
            raw: true,
          });
          expect(result).toEqual(value([1, 2]));
        });
      });
    });

    runScenario({
      description: 'GIVEN a muster graph containing a nested variable',
      graph: () =>
        muster({
          deeply: {
            nested: {
              variable: variable('initial'),
            },
          },
          variable: variable('start value'),
        }),
      operations: [
        operation({
          description: 'WHEN the nested variable gets requested',
          input: ref('deeply', 'nested', 'variable'),
          expected: value('initial'),
          operations: (subscriber) => [
            operation({
              description: 'WHEN setting variable with root and path as string',
              input: set(ref('deeply', 'nested'), 'variable', 'value 1'),
              expected: value('value 1'),
              before() {
                jest.clearAllMocks();
              },
              assert() {
                expect(subscriber().next).toHaveBeenCalledTimes(1);
                expect(subscriber().next).toHaveBeenCalledWith(value('value 1'));
              },
            }),
            operation({
              description: 'WHEN setting variable with root and path as array of strings',
              input: set(ref('deeply'), ['nested', 'variable'], 'value 2'),
              expected: value('value 2'),
              before() {
                jest.clearAllMocks();
              },
              assert() {
                expect(subscriber().next).toHaveBeenCalledTimes(1);
                expect(subscriber().next).toHaveBeenCalledWith(value('value 2'));
              },
            }),
            operation({
              description: 'WHEN setting variable with path as array',
              input: set(['deeply', 'nested', 'variable'], 'value 3'),
              expected: value('value 3'),
              before() {
                jest.clearAllMocks();
              },
              assert() {
                expect(subscriber().next).toHaveBeenCalledTimes(1);
                expect(subscriber().next).toHaveBeenCalledWith(value('value 3'));
              },
            }),
          ],
        }),
        operation({
          description: 'WHEN the variable from the root gets requested',
          input: ref('variable'),
          expected: value('start value'),
          operations: (subscriber) => [
            operation({
              description: 'WHEN setting variable with path as string',
              input: set('variable', 'value 1'),
              expected: value('value 1'),
              before() {
                jest.clearAllMocks();
              },
              assert() {
                expect(subscriber().next).toHaveBeenCalledTimes(1);
                expect(subscriber().next).toHaveBeenCalledWith(value('value 1'));
              },
            }),
            operation({
              description: 'WHEN setting variable with path as array of strings',
              input: set(['variable'], 'value 2'),
              expected: value('value 2'),
              before() {
                jest.clearAllMocks();
              },
              assert() {
                expect(subscriber().next).toHaveBeenCalledTimes(1);
                expect(subscriber().next).toHaveBeenCalledWith(value('value 2'));
              },
            }),
            operation({
              description: 'WHEN setting variable with root',
              input: set(ref('variable'), 'value 3'),
              expected: value('value 3'),
              before() {
                jest.clearAllMocks();
              },
              assert() {
                expect(subscriber().next).toHaveBeenCalledTimes(1);
                expect(subscriber().next).toHaveBeenCalledWith(value('value 3'));
              },
            }),
          ],
        }),
      ],
    });
  });
});
