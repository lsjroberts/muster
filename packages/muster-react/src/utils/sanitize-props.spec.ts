import { Matcher, types } from '@dws/muster';
import {
  CallerMatcher,
  GetterMatcher,
  isCallerMatcher,
  isGetterMatcher,
  isListMatcher,
  isSetterMatcher,
  isTreeMatcher,
  ListMatcher,
  propTypes,
  SetterMatcher,
  TreeMatcher,
} from '../types';
import { sanitizeProps } from './sanitize-props';

describe('sanitizeProps()', () => {
  describe('WHEN calling with empty object', () => {
    it('SHOULD return an empty tree matcher', () => {
      const matcher = sanitizeProps({});
      expect(isTreeMatcher(matcher)).toBeTruthy();
      const treeMatcher = matcher as TreeMatcher<any>;
      expect(treeMatcher.metadata.options).toEqual({});
    });
  });

  describe('WHEN calling with a flat tree', () => {
    let matcher: Matcher<any, any>;

    beforeEach(() => {
      matcher = sanitizeProps({
        firstName: types.string,
        id: types.number,
        lastName: propTypes.getter(types.string),
        otherName: propTypes.getter('name'),
        otherTypedFlag: propTypes.getter('flagName', types.bool),
        genericSetter: propTypes.setter(),
        namedSetter: propTypes.setter('someName'),
        typedSetter: propTypes.setter(types.string),
        namedAndTypedSetter: propTypes.setter('toSet', types.date),
        genericCaller: propTypes.caller(),
        namedCaller: propTypes.caller('callerName'),
        callerWithNoArgs: propTypes.caller([]),
        typedCaller: propTypes.caller([types.number, types.string]),
        namedCallerWithNoArgs: propTypes.caller('name', []),
        namedAndTypedCaller: propTypes.caller('otherName', [types.number, types.bool]),
        primitiveList: propTypes.list(),
        namedPrimitiveList: propTypes.list('listName'),
        typedPrimitiveList: propTypes.list(types.number),
        namedTypedPrimitiveList: propTypes.list('typedListName', types.bool),
        list: propTypes.list({
          name: types.string,
          description: types.optional(types.string),
        }),
        namedList: propTypes.list('namedList', {
          id: types.number,
          name: types.string,
        }),
      });
    });

    it('SHOULD return a tree matcher', () => {
      expect(isTreeMatcher(matcher)).toBeTruthy();
    });

    it('SHOULD contain a getter for first name', () => {
      const firstName = (matcher as TreeMatcher<any>).metadata.options.firstName as GetterMatcher<
        any,
        any,
        any
      >;
      expect(isGetterMatcher(firstName)).toBeTruthy();
      expect(firstName.metadata.options.name).toBeUndefined();
      expect(firstName.metadata.options.type).toBe(types.string);
    });

    it('SHOULD contain a getter for id', () => {
      const id = (matcher as TreeMatcher<any>).metadata.options.id as GetterMatcher<any, any, any>;
      expect(isGetterMatcher(id)).toBeTruthy();
      expect(id.metadata.options.name).toBeUndefined();
      expect(id.metadata.options.type).toBe(types.number);
    });

    it('SHOULD contain a getter for lastName', () => {
      const lastName = (matcher as TreeMatcher<any>).metadata.options.lastName as GetterMatcher<
        any,
        any,
        any
      >;
      expect(isGetterMatcher(lastName)).toBeTruthy();
      expect(lastName.metadata.options.name).toBeUndefined();
      expect(lastName.metadata.options.type).toBe(types.string);
    });

    it('SHOULD contain a getter for otherName', () => {
      const otherName = (matcher as TreeMatcher<any>).metadata.options.otherName as GetterMatcher<
        any,
        any,
        any
      >;
      expect(isGetterMatcher(otherName)).toBeTruthy();
      expect(otherName.metadata.options.name).toBe('name');
      expect(otherName.metadata.options.type).toBe(types.any);
    });

    it('SHOULD contain a getter for otherTypedFlag', () => {
      const otherTypedFlag = (matcher as TreeMatcher<any>).metadata.options
        .otherTypedFlag as GetterMatcher<any, any, any>;
      expect(isGetterMatcher(otherTypedFlag)).toBeTruthy();
      expect(otherTypedFlag.metadata.options.name).toBe('flagName');
      expect(otherTypedFlag.metadata.options.type).toBe(types.bool);
    });

    it('SHOULD contain a setter for genericSetter', () => {
      const genericSetter = (matcher as TreeMatcher<any>).metadata.options
        .genericSetter as SetterMatcher<any, any>;
      expect(isSetterMatcher(genericSetter)).toBeTruthy();
      expect(genericSetter.metadata.options.name).toBeUndefined();
      expect(genericSetter.metadata.options.type).toBeUndefined();
    });

    it('SHOULD contain a setter for namedSetter', () => {
      const namedSetter = (matcher as TreeMatcher<any>).metadata.options
        .namedSetter as SetterMatcher<any, any>;
      expect(isSetterMatcher(namedSetter)).toBeTruthy();
      expect(namedSetter.metadata.options.name).toBe('someName');
      expect(namedSetter.metadata.options.type).toBeUndefined();
    });

    it('SHOULD contain a setter for typedSetter', () => {
      const typedSetter = (matcher as TreeMatcher<any>).metadata.options
        .typedSetter as SetterMatcher<any, any>;
      expect(isSetterMatcher(typedSetter)).toBeTruthy();
      expect(typedSetter.metadata.options.name).toBeUndefined();
      expect(typedSetter.metadata.options.type).toBe(types.string);
    });

    it('SHOULD contain a setter for namedAndTypedSetter', () => {
      const namedAndTypedSetter = (matcher as TreeMatcher<any>).metadata.options
        .namedAndTypedSetter as SetterMatcher<any, any>;
      expect(isSetterMatcher(namedAndTypedSetter)).toBeTruthy();
      expect(namedAndTypedSetter.metadata.options.name).toBe('toSet');
      expect(namedAndTypedSetter.metadata.options.type).toBe(types.date);
    });

    it('SHOULD contain a caller for genericCaller', () => {
      const genericCaller = (matcher as TreeMatcher<any>).metadata.options
        .genericCaller as CallerMatcher<any, any>;
      expect(isCallerMatcher(genericCaller)).toBeTruthy();
      expect(genericCaller.metadata.options.name).toBeUndefined();
      expect(genericCaller.metadata.options.args).toBeUndefined();
    });

    it('SHOULD contain a caller for namedCaller', () => {
      const namedCaller = (matcher as TreeMatcher<any>).metadata.options
        .namedCaller as CallerMatcher<any, any>;
      expect(isCallerMatcher(namedCaller)).toBeTruthy();
      expect(namedCaller.metadata.options.name).toBe('callerName');
      expect(namedCaller.metadata.options.args).toBeUndefined();
    });

    it('SHOULD contain a caller for callerWithNoArgs', () => {
      const callerWithNoArgs = (matcher as TreeMatcher<any>).metadata.options
        .callerWithNoArgs as CallerMatcher<any, any>;
      expect(isCallerMatcher(callerWithNoArgs)).toBeTruthy();
      expect(callerWithNoArgs.metadata.options.name).toBeUndefined();
      expect(callerWithNoArgs.metadata.options.args).toEqual([]);
    });

    it('SHOULD contain a caller for typedCaller', () => {
      const typedCaller = (matcher as TreeMatcher<any>).metadata.options
        .typedCaller as CallerMatcher<any, any>;
      expect(isCallerMatcher(typedCaller)).toBeTruthy();
      expect(typedCaller.metadata.options.name).toBeUndefined();
      expect(typedCaller.metadata.options.args).toEqual([types.number, types.string]);
    });

    it('SHOULD contain a caller for namedCallerWithNoArgs', () => {
      const namedCallerWithNoArgs = (matcher as TreeMatcher<any>).metadata.options
        .namedCallerWithNoArgs as CallerMatcher<any, any>;
      expect(isCallerMatcher(namedCallerWithNoArgs)).toBeTruthy();
      expect(namedCallerWithNoArgs.metadata.options.name).toBe('name');
      expect(namedCallerWithNoArgs.metadata.options.args).toEqual([]);
    });

    it('SHOULD contain a caller for namedAndTypedCaller', () => {
      const namedAndTypedCaller = (matcher as TreeMatcher<any>).metadata.options
        .namedAndTypedCaller as CallerMatcher<any, any>;
      expect(isCallerMatcher(namedAndTypedCaller)).toBeTruthy();
      expect(namedAndTypedCaller.metadata.options.name).toBe('otherName');
      expect(namedAndTypedCaller.metadata.options.args).toEqual([types.number, types.bool]);
    });

    it('SHOULD contain a primitive list', () => {
      const primitiveList = (matcher as TreeMatcher<any>).metadata.options
        .primitiveList as ListMatcher<any, undefined, undefined>;
      expect(isListMatcher(primitiveList)).toBeTruthy();
      expect(primitiveList.metadata.options.name).toBeUndefined();
      expect(primitiveList.metadata.options.itemMatcher).toBeUndefined();
    });

    it('SHOULD contain a named primitive list', () => {
      const namedPrimitiveList = (matcher as TreeMatcher<any>).metadata.options
        .namedPrimitiveList as ListMatcher<any, any, any>;
      expect(isListMatcher(namedPrimitiveList)).toBeTruthy();
      expect(namedPrimitiveList.metadata.options.name).toBe('listName');
      expect(namedPrimitiveList.metadata.options.itemMatcher).toBeUndefined();
    });

    it('SHOULD contain a typed primitive list', () => {
      const typedPrimitiveList = (matcher as TreeMatcher<any>).metadata.options
        .typedPrimitiveList as ListMatcher<any, any, any>;
      expect(isListMatcher(typedPrimitiveList)).toBeTruthy();
      expect(typedPrimitiveList.metadata.options.name).toBeUndefined();
      expect(typedPrimitiveList.metadata.options.itemMatcher).toEqual(types.number);
    });

    it('SHOULD contain a named typed primitive list', () => {
      const namedTypedPrimitiveList = (matcher as TreeMatcher<any>).metadata.options
        .namedTypedPrimitiveList as ListMatcher<any, any, any>;
      expect(isListMatcher(namedTypedPrimitiveList)).toBeTruthy();
      expect(namedTypedPrimitiveList.metadata.options.name).toBe('typedListName');
      expect(namedTypedPrimitiveList.metadata.options.itemMatcher).toEqual(types.bool);
    });

    it('SHOULD contain a list with fields', () => {
      const listWithFields = (matcher as TreeMatcher<any>).metadata.options.list as ListMatcher<
        any,
        any,
        any
      >;
      expect(isListMatcher(listWithFields)).toBeTruthy();
      expect(listWithFields.metadata.options.name).toBeUndefined();
      expect(listWithFields.metadata.options.itemMatcher).not.toBeUndefined();

      const itemMatcher = listWithFields.metadata.options.itemMatcher as TreeMatcher<any>;
      expect(isTreeMatcher(itemMatcher)).toBeTruthy();

      const nameMatcher = itemMatcher.metadata.options.name as GetterMatcher<any, any, any>;
      expect(nameMatcher).not.toBeUndefined();
      expect(isGetterMatcher(nameMatcher)).toBeTruthy();
      expect(nameMatcher.metadata.options.name).toBeUndefined();
      expect(nameMatcher.metadata.options.type).toBe(types.string);

      const descriptionMatcher = itemMatcher.metadata.options.description as GetterMatcher<
        any,
        any,
        any
      >;
      expect(descriptionMatcher).not.toBeUndefined();
      expect(isGetterMatcher(descriptionMatcher)).toBeTruthy();
      expect(descriptionMatcher.metadata.options.name).toBeUndefined();
      expect(descriptionMatcher.metadata.options.type.metadata.type).toBe(types.optional);
      expect(descriptionMatcher.metadata.options.type.metadata.options).toBe(types.string);
    });

    it('SHOULD contain a named list with fields', () => {
      const namedList = (matcher as TreeMatcher<any>).metadata.options.namedList as ListMatcher<
        any,
        any,
        any
      >;
      expect(isListMatcher(namedList)).toBeTruthy();
      expect(namedList.metadata.options.name).toBe('namedList');
      expect(namedList.metadata.options.itemMatcher).not.toBeUndefined();

      const itemMatcher = namedList.metadata.options.itemMatcher as TreeMatcher<any>;
      expect(isTreeMatcher(itemMatcher)).toBeTruthy();

      const idMatcher = itemMatcher.metadata.options.id as GetterMatcher<any, any, any>;
      expect(idMatcher).not.toBeUndefined();
      expect(isGetterMatcher(idMatcher)).toBeTruthy();
      expect(idMatcher.metadata.options.name).toBeUndefined();
      expect(idMatcher.metadata.options.type).toBe(types.number);

      const nameMatcher = itemMatcher.metadata.options.name as GetterMatcher<any, any, any>;
      expect(nameMatcher).not.toBeUndefined();
      expect(isGetterMatcher(nameMatcher)).toBeTruthy();
      expect(nameMatcher.metadata.options.name).toBeUndefined();
      expect(nameMatcher.metadata.options.type).toBe(types.string);
    });
  });
});
