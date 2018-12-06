import {
  catchError,
  CreateCallerNodeDefinition,
  CreateSetterNodeDefinition,
  defer,
  entries,
  EntriesNodeDefinition,
  FieldsNodeDefinition,
  isCreateCallerNodeDefinition,
  isCreateSetterNodeDefinition,
  isEntriesNodeDefinition,
  isFieldsNodeDefinition,
  isKeyNodeDefinition,
  isPending,
  isQueryNodeDefinition,
  key,
  KeyNodeDefinition,
  Matcher,
  NodeDefinition,
  query,
  QueryNodeDefinition,
  root,
  types,
  value,
} from '@dws/muster';
import {
  CallerArgumentMatcher,
  CallerMatcher,
  isCallerArgumentMatcher,
  isCallerMatcher,
  isSetterMatcher,
  isSetterValueMatcher,
  propTypes,
  SetterMatcher,
  SetterValueMatcher,
  TreeMatcher,
} from '../types';
import { buildQuery } from './build-query';
import { createDisposeEmitter } from './create-dispose-emitter';
import { toRequirementsTree } from './to-requirements-tree';

describe('buildQuery()', () => {
  const disposeEmitter = createDisposeEmitter();

  describe('WHEN called with empty tree', () => {
    it('SHOULD not return a query', () => {
      const result = buildQuery(disposeEmitter, propTypes.tree({}));
      expect(result).toBeUndefined();
    });
  });

  describe('WHEN called with a tree with a single getter', () => {
    it('SHOULD return correct query', () => {
      const result = buildQuery(
        disposeEmitter,
        propTypes.tree({
          name: types.string,
        }),
      );
      expect(result).toEqual(
        query(root(), {
          name: key('name'),
        }),
      );
    });
  });

  describe('WHEN called with a tree with all possible types of fields', () => {
    let props: TreeMatcher<any>;
    let result: NodeDefinition | undefined;

    beforeEach(() => {
      props = propTypes.tree({
        string: types.string,
        getter: propTypes.getter(),
        namedGetter: propTypes.getter('named'),
        typedGetter: propTypes.getter(types.bool),
        namedTypedGetter: propTypes.getter('namedTyped', types.any),
        caller: propTypes.caller(),
        namedCaller: propTypes.caller('named'),
        typedCaller: propTypes.caller([types.number]),
        namedTypedCaller: propTypes.caller('namedTyped', [types.any]),
        setter: propTypes.setter(),
        namedSetter: propTypes.setter('named'),
        typedSetter: propTypes.setter(types.func),
        namedTypedSetter: propTypes.setter('namedTyped', types.array),
        plainList: propTypes.list(),
        namedPlainList: propTypes.list('namedPlain'),
        typedPlainList: propTypes.list(types.date),
        namedTypedPlainList: propTypes.list('namedTypedPlain', types.bool),
        deeply: propTypes.tree({
          nested: propTypes.tree({
            string: types.string,
            getter: propTypes.getter(),
            namedGetter: propTypes.getter('named'),
            typedGetter: propTypes.getter(types.bool),
            namedTypedGetter: propTypes.getter('namedTyped', types.any),
          }),
        }),
        typedList: propTypes.list({
          string: types.string,
          getter: propTypes.getter(),
          namedGetter: propTypes.getter('named'),
          typedGetter: propTypes.getter(types.bool),
          namedTypedGetter: propTypes.getter('namedTyped', types.any),
          caller: propTypes.caller(),
          namedCaller: propTypes.caller('named'),
          typedCaller: propTypes.caller([types.number]),
          namedTypedCaller: propTypes.caller('namedTyped', [types.any]),
          setter: propTypes.setter(),
          namedSetter: propTypes.setter('named'),
          typedSetter: propTypes.setter(types.func),
          namedTypedSetter: propTypes.setter('namedTyped', types.array),
          deeply: propTypes.tree({
            nested: propTypes.tree({
              string: types.string,
              getter: propTypes.getter(),
              namedGetter: propTypes.getter('named'),
              typedGetter: propTypes.getter(types.bool),
              namedTypedGetter: propTypes.getter('namedTyped', types.any),
            }),
          }),
        }),
      });
      result = buildQuery(disposeEmitter, props);
    });

    function testCallerField(field: NodeDefinition, name: string, type?: Array<Matcher<any, any>>) {
      expect(isCreateCallerNodeDefinition(field)).toBeTruthy();
      const caller = field as CreateCallerNodeDefinition;
      expect(caller.properties.key).toBe(name);
      expect(isCallerArgumentMatcher(caller.properties.matcher)).toBeTruthy();
      const argumentMatcher = caller.properties.matcher as CallerArgumentMatcher<any, any>;
      expect(isCallerMatcher(argumentMatcher.metadata.options)).toBeTruthy();
      const callerMatcher = argumentMatcher.metadata.options as CallerMatcher<any, any>;
      if (type) {
        expect(callerMatcher.metadata.options.args).toEqual(type);
      } else {
        expect(callerMatcher.metadata.options.args).toBeUndefined();
      }
    }

    function testSetterField(field: NodeDefinition, name: string, type?: Matcher<any, any>) {
      expect(isCreateSetterNodeDefinition(field)).toBeTruthy();
      const setter = field as CreateSetterNodeDefinition;
      expect(setter.properties.key).toBe(name);
      expect(isSetterValueMatcher(setter.properties.matcher)).toBeTruthy();
      const valueMatcher = setter.properties.matcher as SetterValueMatcher<any, any>;
      expect(isSetterMatcher(valueMatcher.metadata.options)).toBeTruthy();
      const setterMatcher = valueMatcher.metadata.options as SetterMatcher<any, any>;
      if (type) {
        expect(setterMatcher.metadata.options.type).toEqual(type);
      } else {
        expect(setterMatcher.metadata.options.type).toBeUndefined();
      }
    }

    it('SHOULD return correct query', () => {
      expect(result).not.toBeUndefined();
      expect(isQueryNodeDefinition(result!)).toBeTruthy();
      const query = (result as any) as QueryNodeDefinition;
      const fields = query.properties.keys as FieldsNodeDefinition;
      // Test getters
      expect(fields.properties.fields.string).toEqual(key('string'));
      expect(fields.properties.fields.getter).toEqual(key('getter'));
      expect(fields.properties.fields.namedGetter).toEqual(key('named'));
      expect(fields.properties.fields.typedGetter).toEqual(key('typedGetter'));
      expect(fields.properties.fields.namedTypedGetter).toEqual(key('namedTyped'));
      // Test callers
      testCallerField(fields.properties.fields.caller, 'caller');
      testCallerField(fields.properties.fields.namedCaller, 'named');
      testCallerField(fields.properties.fields.typedCaller, 'typedCaller', [types.number]);
      testCallerField(fields.properties.fields.namedTypedCaller, 'namedTyped', [types.any]);
      // Test setter
      testSetterField(fields.properties.fields.setter, 'setter');
      testSetterField(fields.properties.fields.namedSetter, 'named');
      testSetterField(fields.properties.fields.typedSetter, 'typedSetter', types.func);
      testSetterField(fields.properties.fields.namedTypedSetter, 'namedTyped', types.array);
      // Test plain lists
      expect(fields.properties.fields.plainList).toEqual(key('plainList', entries()));
      expect(fields.properties.fields.namedPlainList).toEqual(key('namedPlain', entries()));
      expect(fields.properties.fields.typedPlainList).toEqual(key('typedPlainList', entries()));
      expect(fields.properties.fields.namedTypedPlainList).toEqual(
        key('namedTypedPlain', entries()),
      );
      // Test deeply nested fields
      const deeplyKey = fields.properties.fields.deeply as KeyNodeDefinition;
      expect(isKeyNodeDefinition(deeplyKey)).toBeTruthy();
      const deeplyFields = deeplyKey.properties.children as FieldsNodeDefinition;
      expect(isFieldsNodeDefinition(deeplyFields)).toBeTruthy();
      const nestedKey = deeplyFields.properties.fields.nested as KeyNodeDefinition;
      expect(isKeyNodeDefinition(nestedKey)).toBeTruthy();
      const nestedFields = nestedKey.properties.children as FieldsNodeDefinition;
      expect(isFieldsNodeDefinition(nestedFields)).toBeTruthy();
      expect(nestedFields.properties.fields.string).toEqual(key('string'));
      expect(nestedFields.properties.fields.getter).toEqual(key('getter'));
      expect(nestedFields.properties.fields.namedGetter).toEqual(key('named'));
      expect(nestedFields.properties.fields.typedGetter).toEqual(key('typedGetter'));
      expect(nestedFields.properties.fields.namedTypedGetter).toEqual(key('namedTyped'));
      // Test a nested list
      const typedListKey = fields.properties.fields.typedList as KeyNodeDefinition;
      expect(isKeyNodeDefinition(typedListKey)).toBeTruthy();
      const typedListEntries = typedListKey.properties.children as EntriesNodeDefinition;
      expect(isEntriesNodeDefinition(typedListEntries)).toBeTruthy();
      const typedListFields = typedListEntries.properties.children as FieldsNodeDefinition;
      expect(isFieldsNodeDefinition(typedListFields)).toBeTruthy();
      expect(typedListFields.properties.fields.string).toEqual(key('string'));
      expect(typedListFields.properties.fields.getter).toEqual(key('getter'));
      expect(typedListFields.properties.fields.namedGetter).toEqual(key('named'));
      expect(typedListFields.properties.fields.typedGetter).toEqual(key('typedGetter'));
      expect(typedListFields.properties.fields.namedTypedGetter).toEqual(key('namedTyped'));
      testCallerField(typedListFields.properties.fields.caller, 'caller');
      testCallerField(typedListFields.properties.fields.namedCaller, 'named');
      testCallerField(typedListFields.properties.fields.typedCaller, 'typedCaller', [types.number]);
      testCallerField(typedListFields.properties.fields.namedTypedCaller, 'namedTyped', [
        types.any,
      ]);
      testSetterField(typedListFields.properties.fields.setter, 'setter');
      testSetterField(typedListFields.properties.fields.namedSetter, 'named');
      testSetterField(typedListFields.properties.fields.typedSetter, 'typedSetter', types.func);
      testSetterField(
        typedListFields.properties.fields.namedTypedSetter,
        'namedTyped',
        types.array,
      );
      // Test deeply nested list fields
      const listDeeplyKey = typedListFields.properties.fields.deeply as KeyNodeDefinition;
      expect(isKeyNodeDefinition(listDeeplyKey)).toBeTruthy();
      const listDeeplyFields = listDeeplyKey.properties.children as FieldsNodeDefinition;
      expect(isFieldsNodeDefinition(listDeeplyFields)).toBeTruthy();
      const listNestedKey = listDeeplyFields.properties.fields.nested as KeyNodeDefinition;
      expect(isKeyNodeDefinition(listNestedKey)).toBeTruthy();
      const listNestedFields = listNestedKey.properties.children as FieldsNodeDefinition;
      expect(isFieldsNodeDefinition(listNestedFields)).toBeTruthy();
      expect(listNestedFields.properties.fields.string).toEqual(key('string'));
      expect(listNestedFields.properties.fields.getter).toEqual(key('getter'));
      expect(listNestedFields.properties.fields.namedGetter).toEqual(key('named'));
      expect(listNestedFields.properties.fields.typedGetter).toEqual(key('typedGetter'));
      expect(listNestedFields.properties.fields.namedTypedGetter).toEqual(key('namedTyped'));
    });

    describe('WHEN called with valid resolved props', () => {
      it('SHOULD return true', () => {
        expect(
          props({
            string: 'string value',
            getter: true,
            namedGetter: false,
            typedGetter: true,
            namedTypedGetter: null,
            caller: () => {},
            namedCaller: () => {},
            typedCaller: () => {},
            namedTypedCaller: () => {},
            setter: () => {},
            namedSetter: () => {},
            typedSetter: () => {},
            namedTypedSetter: () => {},
            plainList: [],
            namedPlainList: [],
            typedPlainList: [],
            namedTypedPlainList: [],
            deeply: {
              nested: {
                string: 'string value',
                getter: true,
                namedGetter: false,
                typedGetter: true,
                namedTypedGetter: null,
              },
            },
            typedList: [],
          }),
        ).toBeTruthy();
      });
    });
  });

  describe('GIVEN a tree containing requirements', () => {
    let props: TreeMatcher<any>;
    let result: NodeDefinition | undefined;

    beforeEach(() => {
      props = propTypes.tree({
        ...toRequirementsTree(
          '1',
          propTypes.tree({
            name: types.string,
            description: types.string,
            nested: propTypes.tree({
              id: types.number,
            }),
          }),
        ),
        name: types.string,
      });
      result = buildQuery(disposeEmitter, props);
    });

    it('SHOULD return correct query', () => {
      expect(result).toEqual(
        query(root(), {
          '$$required(1):name': key('name'),
          '$$required(1):description': key('description'),
          '$$required(1):nested': key('nested', {
            id: key('id'),
          }),
          name: key('name'),
        }),
      );
    });

    describe('WHEN called with valid resolved props', () => {
      it('SHOULD return true', () => {
        expect(
          props({
            '$$required(1):name': 'Name',
            '$$required(1):description': 'Description',
            '$$required(1):nested': {
              id: 1,
            },
            name: 'Name',
          }),
        ).toBeTruthy();
      });
    });
  });

  describe('GIVEN a tree containing injected props', () => {
    let props: TreeMatcher<any>;
    let result: NodeDefinition | undefined;

    beforeEach(() => {
      props = propTypes.tree({
        name: propTypes.injected(),
        deeply: propTypes.tree({
          nested: propTypes.tree({
            description: propTypes.injected(),
          }),
        }),
      });
      result = buildQuery(disposeEmitter, props);
    });

    it('SHOULD return an undefined query', () => {
      expect(result).toBeUndefined();
    });
  });

  describe('GIVEN a tree containing injected props mixed with normal props', () => {
    let props: TreeMatcher<any>;
    let result: NodeDefinition | undefined;

    beforeEach(() => {
      props = propTypes.tree({
        name: propTypes.injected(),
        deeply: propTypes.tree({
          nested: propTypes.tree({
            description: propTypes.injected(),
            id: types.number,
          }),
        }),
      });
      result = buildQuery(disposeEmitter, props);
    });

    it('SHOULD return a query for a deeply nested id', () => {
      expect(result).toEqual(
        query(root(), {
          deeply: key('deeply', {
            nested: key('nested', {
              id: key('id'),
            }),
          }),
        }),
      );
    });

    describe('WHEN called with just the query props', () => {
      it('SHOULD return true', () => {
        expect(
          props({
            deeply: {
              nested: {
                id: 1,
              },
            },
          }),
        ).toBeTruthy();
      });
    });

    describe('WHEN called with valid resolved props', () => {
      it('SHOULD return true', () => {
        expect(
          props({
            name: 'test name',
            deeply: {
              nested: {
                description: 'test description',
                id: 2,
              },
            },
          }),
        ).toBeTruthy();
      });
    });

    describe('WHEN called with some unexpected props', () => {
      it('SHOULD return true', () => {
        expect(
          props({
            name: 'test name',
            deeply: {
              nested: {
                description: 'test description',
                id: 2,
                surprise: true,
              },
            },
          }),
        ).toBeFalsy();
      });
    });
  });

  describe('GIVEN a tree with deferred getter', () => {
    it('SHOULD return correct query', () => {
      const result = buildQuery(
        disposeEmitter,
        propTypes.tree({
          name: propTypes.defer(types.string),
        }),
      );
      expect(result).toEqual(
        query(root(), {
          name: defer(key('name')),
        }),
      );
    });
  });

  describe('GIVEN a tree with deferred tree', () => {
    it('SHOULD return correct query', () => {
      const result = buildQuery(
        disposeEmitter,
        propTypes.tree({
          user: propTypes.defer(
            propTypes.tree({
              firstName: types.string,
              lastName: types.string,
            }),
          ),
        }),
      );
      expect(result).toEqual(
        query(root(), {
          user: defer(
            key('user', {
              firstName: key('firstName'),
              lastName: key('lastName'),
            }),
          ),
        }),
      );
    });
  });

  describe('GIVEN a tree with deferred tree (implicit)', () => {
    it('SHOULD return correct query', () => {
      const result = buildQuery(
        disposeEmitter,
        propTypes.tree({
          user: propTypes.defer({
            firstName: types.string,
            lastName: types.string,
            nested: {
              flag: types.bool,
            },
          }),
        }),
      );
      expect(result).toEqual(
        query(root(), {
          user: defer(
            key('user', {
              firstName: key('firstName'),
              lastName: key('lastName'),
              nested: key('nested', {
                flag: key('flag'),
              }),
            }),
          ),
        }),
      );
    });
  });

  describe('GIVEN a tree with deferred list', () => {
    it('SHOULD return correct query', () => {
      const result = buildQuery(
        disposeEmitter,
        propTypes.tree({
          addresses: propTypes.defer(
            propTypes.list({
              street: types.string,
            }),
          ),
        }),
      );
      expect(result).toEqual(
        query(root(), {
          addresses: defer(
            key(
              'addresses',
              entries({
                street: key('street'),
              }),
            ),
          ),
        }),
      );
    });
  });

  describe('GIVEN a tree with deferred getter with a fallback', () => {
    it('SHOULD return correct query', () => {
      const fallback = (previous: NodeDefinition) => {
        return previous || value('Loading...');
      };
      const result = buildQuery(
        disposeEmitter,
        propTypes.tree({
          user: propTypes.defer(fallback, {
            firstName: types.string,
            lastName: types.string,
          }),
        }),
      );
      expect(result).toEqual(
        query(root(), {
          user: defer(
            fallback,
            key('user', {
              firstName: key('firstName'),
              lastName: key('lastName'),
            }),
          ),
        }),
      );
    });
  });

  describe('GIVEN a tree with `isLoading` pointing to an invalid prop', () => {
    it('SHOULD throw an error', () => {
      expect(() => {
        buildQuery(
          disposeEmitter,
          propTypes.tree({
            isLoadingName: propTypes.isLoading('name'),
          }),
        );
      }).toThrow();
    });
  });

  describe('GIVEN a tree with `isLoading` pointing to a getter', () => {
    it('SHOULD return correct query', () => {
      const result = buildQuery(
        disposeEmitter,
        propTypes.tree({
          name: types.string,
          isLoadingName: propTypes.isLoading('name'),
        }),
      );
      expect(result).toEqual(
        query(root(), {
          name: key('name'),
          isLoadingName: isPending(key('name')),
        }),
      );
    });
  });

  describe('GIVEN a tree with `isLoading` pointing to a named getter', () => {
    it('SHOULD return correct query', () => {
      const result = buildQuery(
        disposeEmitter,
        propTypes.tree({
          name: propTypes.getter('firstName', types.string),
          isLoadingName: propTypes.isLoading('name'),
        }),
      );
      expect(result).toEqual(
        query(root(), {
          name: key('firstName'),
          isLoadingName: isPending(key('firstName')),
        }),
      );
    });
  });

  describe('GIVEN a leaf wrapped in catchError', () => {
    it('SHOULD return correct query', () => {
      function fallbackGenerator() {
        return value('Boom!');
      }
      const result = buildQuery(
        disposeEmitter,
        propTypes.tree({
          name: propTypes.catchError(fallbackGenerator, types.string),
        }),
      );
      expect(result).toEqual(
        query(root(), {
          name: catchError(fallbackGenerator, key('name')),
        }),
      );
    });
  });
});
