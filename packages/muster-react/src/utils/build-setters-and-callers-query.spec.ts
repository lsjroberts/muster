import {
  CreateCallerNodeDefinition,
  CreateSetterNodeDefinition,
  FieldsNodeDefinition,
  isCreateCallerNodeDefinition,
  isCreateSetterNodeDefinition,
  isFieldsNodeDefinition,
  isKeyNodeDefinition,
  isQueryNodeDefinition,
  KeyNodeDefinition,
  NodeDefinition,
  QueryNodeDefinition,
  types,
  value,
} from '@dws/muster';
import { propTypes } from '..';
import { buildSettersAndCallersQuery } from './build-setters-and-callers-query';
import { createDisposeEmitter } from './create-dispose-emitter';

describe('buildSettersAndCallersQuery()', () => {
  const disposeEmitter = createDisposeEmitter();

  describe('WHEN called with empty props tree', () => {
    it('SHOULD return undefined', () => {
      expect(buildSettersAndCallersQuery(disposeEmitter, propTypes.tree({}))).toBeUndefined();
    });
  });

  describe('WHEN called with only getters and lists', () => {
    it('SHOULD return undefined', () => {
      expect(
        buildSettersAndCallersQuery(
          disposeEmitter,
          propTypes.tree({
            getter: propTypes.getter(),
            list: propTypes.list(),
            typedList: propTypes.list({
              name: propTypes.getter(),
            }),
            nested: propTypes.tree({
              getter: propTypes.getter(),
              list: propTypes.list(),
              typedList: propTypes.list({
                name: propTypes.getter(),
              }),
            }),
          }),
        ),
      ).toBeUndefined();
    });
  });

  describe('WHEN called with setters and callers', () => {
    function validateCaller(node: NodeDefinition, name: string) {
      const caller = node as CreateCallerNodeDefinition;
      expect(isCreateCallerNodeDefinition(caller)).toBeTruthy();
      expect(caller.properties.key).toBe(name);
    }

    function validateSetter(node: NodeDefinition, name: string) {
      const setter = node as CreateSetterNodeDefinition;
      expect(isCreateSetterNodeDefinition(setter)).toBeTruthy();
      expect(setter.properties.key).toBe(name);
    }

    it('SHOULD return correct query', () => {
      const result = buildSettersAndCallersQuery(
        disposeEmitter,
        propTypes.tree({
          caller: propTypes.caller(),
          namedCaller: propTypes.caller('name'),
          typedCaller: propTypes.caller([types.bool]),
          namedTypedCaller: propTypes.caller('namedAndTyped', [types.number]),
          setter: propTypes.setter(),
          namedSetter: propTypes.setter('name'),
          typedSetter: propTypes.setter(types.string),
          namedTypedSetter: propTypes.setter('namedAndTyped', types.string),
        }),
      );
      expect(result).not.toBeUndefined();
      const query = result as QueryNodeDefinition;
      expect(isQueryNodeDefinition(query)).toBeTruthy();
      const fields = query.properties.keys as FieldsNodeDefinition;
      expect(isFieldsNodeDefinition(fields)).toBeTruthy();
      validateCaller(fields.properties.fields.caller, 'caller');
      validateCaller(fields.properties.fields.namedCaller, 'name');
      validateCaller(fields.properties.fields.typedCaller, 'typedCaller');
      validateCaller(fields.properties.fields.namedTypedCaller, 'namedAndTyped');
      validateSetter(fields.properties.fields.setter, 'setter');
      validateSetter(fields.properties.fields.namedSetter, 'name');
      validateSetter(fields.properties.fields.typedSetter, 'typedSetter');
      validateSetter(fields.properties.fields.namedTypedSetter, 'namedAndTyped');
    });
  });

  describe('WHEN called with a deferred tree without setters and callers', () => {
    it('SHOULD return undefined query', () => {
      const result = buildSettersAndCallersQuery(
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
      expect(result).toBeUndefined();
    });
  });

  describe('WHEN called with a deferred tree with setters and callers', () => {
    it('SHOULD return correct query', () => {
      const result = buildSettersAndCallersQuery(
        disposeEmitter,
        propTypes.tree({
          user: propTypes.defer(
            propTypes.tree({
              firstName: types.string,
              setFirstName: propTypes.setter('firstName', types.string),
              callFunction: propTypes.caller('something'),
            }),
          ),
        }),
      );
      const query = result as QueryNodeDefinition;
      expect(isQueryNodeDefinition(query)).toBeTruthy();
      const fields = query.properties.keys as FieldsNodeDefinition;
      expect(isFieldsNodeDefinition(fields)).toBeTruthy();
      const user = fields.properties.fields.user as KeyNodeDefinition;
      expect(isKeyNodeDefinition(user)).toBeTruthy();
      expect(user.properties.key).toEqual(value('user'));
      const userFields = user.properties.children as FieldsNodeDefinition;
      expect(isFieldsNodeDefinition(userFields)).toBeTruthy();
      expect(userFields.properties.fields.firstName).toBeUndefined();
      const setFirstName = userFields.properties.fields.setFirstName as CreateSetterNodeDefinition;
      expect(isCreateSetterNodeDefinition(setFirstName)).toBeTruthy();
      const callFunction = userFields.properties.fields.callFunction as CreateCallerNodeDefinition;
      expect(isCreateCallerNodeDefinition(callFunction)).toBeTruthy();
    });
  });
});
