import muster, { dispatch, MusterEvent, on, ref, root, tree, value } from '..';
import { MockSubscriber, operation, runScenario } from '../test';

import createModule, { ModuleFactory } from './create-module';

describe('createModule', () => {
  describe('GIVEN a simple module with no dependencies', () => {
    let myModule: ModuleFactory;

    runScenario({
      description: 'AND the module is injected into the graph',
      before() {
        myModule = createModule({}, () => value('foo'));
      },
      graph: () =>
        muster(
          tree({
            nested: myModule({}),
          }),
        ),
      operations: [
        operation({
          description: 'SHOULD pass requests through to the module root node',
          input: ref('nested'),
          expected: value('foo'),
        }),
      ],
    });

    runScenario({
      description: 'AND the module is injected into the graph with no dependencies object',
      before() {
        myModule = createModule({}, () => value('foo'));
      },
      graph: () =>
        muster(
          tree({
            nested: myModule(),
          }),
        ),
      operations: [
        operation({
          description: 'SHOULD pass requests through to the module root node',
          input: ref('nested'),
          expected: value('foo'),
        }),
      ],
    });
  });

  describe('GIVEN a nested module with no dependencies', () => {
    let myModule: ModuleFactory;

    runScenario({
      description: 'AND the module is injected into the graph',
      before() {
        myModule = createModule({}, () =>
          tree({
            inner: tree({
              item: value('foo'),
            }),
          }),
        );
      },
      graph: () =>
        muster(
          tree({
            nested: myModule({}),
          }),
        ),
      operations: [
        operation({
          description: 'SHOULD pass requests through to the module root node',
          input: ref('nested', 'inner', 'item'),
          expected: value('foo'),
        }),
      ],
    });
  });

  describe('GIVEN a module with dependencies', () => {
    let myModule: ModuleFactory;
    beforeEach(() => {
      myModule = createModule(
        {
          foo: true,
        },
        ({ foo }) =>
          tree({
            inner: tree({
              item: foo,
            }),
          }),
      );
    });

    runScenario({
      description: 'AND the module is injected into the graph with simple dependency values',
      graph: () =>
        muster(
          tree({
            nested: myModule({
              foo: value('value:foo'),
            }),
          }),
        ),
      operations: [
        operation({
          description: 'SHOULD pass dependencies through to the module root node',
          input: ref('nested', 'inner', 'item'),
          expected: value('value:foo'),
        }),
      ],
    });

    runScenario({
      description: 'AND the module is injected into the graph with primitive dependency values',
      graph: () =>
        muster(
          tree({
            nested: myModule({
              foo: 'value:foo',
            }),
          }),
        ),
      operations: [
        operation({
          description: 'SHOULD pass dependencies through to the module root node',
          input: ref('nested', 'inner', 'item'),
          expected: value('value:foo'),
        }),
      ],
    });

    runScenario({
      description: 'AND the module is injected into the graph with nested dependency values',
      graph: () =>
        muster(
          tree({
            nested: myModule({
              foo: {
                bar: 'value:bar',
              },
            }),
          }),
        ),
      operations: [
        operation({
          description: 'SHOULD pass dependencies through to the module root node',
          input: ref('nested', 'inner', 'item', 'bar'),
          expected: value('value:bar'),
        }),
      ],
    });

    runScenario({
      description: 'AND the module is injected into the graph with unresolved dependency values',
      graph: () =>
        muster(
          tree({
            nested: myModule({
              foo: ref('other'),
            }),
            other: value('value:foo'),
          }),
        ),
      operations: [
        operation({
          description: 'SHOULD evaluate dependencies in the parent scope',
          input: ref('nested', 'inner', 'item'),
          expected: value('value:foo'),
        }),
      ],
    });

    it('SHOULD throw an error when instantiating the module with missing dependency values', () => {
      expect(() => myModule({})).toThrowError('Missing module dependency: "foo"');
    });

    it('SHOULD throw an error when instantiating the module with extra dependency values', () => {
      expect(() =>
        myModule({
          foo: value('foo'),
          bar: value('bar'),
        }),
      ).toThrowError('Unexpected module dependency: "bar"');
    });
  });

  describe('GIVEN a module with inner root references', () => {
    let myModule: ModuleFactory;
    beforeEach(() => {
      myModule = createModule(
        {
          foo: true,
        },
        ({ foo }) =>
          tree({
            inner: tree({
              item: ref('other'),
            }),
            other: foo,
          }),
      );
    });

    runScenario({
      description: 'AND the module is injected into the graph',
      graph: () =>
        muster(
          tree({
            nested: myModule({
              foo: value('value:foo'),
            }),
          }),
        ),
      operations: [
        operation({
          description: 'SHOULD scope internal references to the module root node',
          input: ref('nested', 'inner', 'item'),
          expected: value('value:foo'),
        }),
      ],
    });
  });

  describe('GIVEN a module with event redispatching', () => {
    let myModule: ModuleFactory;
    beforeEach(() => {
      myModule = createModule(
        {},
        () => on((event: MusterEvent) => value({ lastEvent: event }), value(undefined)),
        (event: MusterEvent): MusterEvent | undefined => {
          switch (event.type) {
            case 'event:passthrough':
              return event;
            case 'event:remap':
              return { type: 'event:inner', payload: event.payload.toUpperCase() };
            default:
              return undefined;
          }
        },
      );
    });

    runScenario({
      description: 'AND the module is injected into the graph',
      graph: () => muster(myModule({})),
      operations: [
        operation({
          description: 'GIVEN a subscription to the root node',
          input: root(),
          expected: value(undefined),
          operations: (subscriber: () => MockSubscriber) => [
            operation({
              description: 'AND a passthrough event is dispatched',
              before: () => jest.clearAllMocks(),
              input: dispatch({ type: 'event:passthrough', payload: 'foo' }),
              assert: () => {
                expect(subscriber().next).toHaveBeenCalledTimes(1);
                expect(subscriber().next).toHaveBeenCalledWith(
                  value({ lastEvent: { type: 'event:passthrough', payload: 'foo' } }),
                );
              },
            }),
            operation({
              description: 'AND a remapped event is dispatched',
              before: () => jest.clearAllMocks(),
              input: dispatch({ type: 'event:remap', payload: 'bar' }),
              assert: () => {
                expect(subscriber().next).toHaveBeenCalledTimes(1);
                expect(subscriber().next).toHaveBeenCalledWith(
                  value({ lastEvent: { type: 'event:inner', payload: 'BAR' } }),
                );
              },
            }),
            operation({
              description: 'AND an unrelated event is dispatched',
              before: () => jest.clearAllMocks(),
              input: dispatch({ type: 'event:unrelated', payload: 'baz' }),
              assert: () => {
                expect(subscriber().next).toHaveBeenCalledTimes(0);
              },
            }),
          ],
        }),
      ],
    });
  });
});
