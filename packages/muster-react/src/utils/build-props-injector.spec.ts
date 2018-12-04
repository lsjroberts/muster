import { types } from '@dws/muster';
import { propTypes } from '../types';
import { buildPropsInjector } from './build-props-injector';

describe('buildPropsInjector()', () => {
  describe('WHEN the props contain no injected props', () => {
    it('SHOULD return correct props', () => {
      const props = propTypes.tree({
        getter: propTypes.getter(types.string),
        setter: propTypes.setter(),
        caller: propTypes.caller(),
      });
      const propsInjector = buildPropsInjector(props, propTypes.tree({}));
      const data = {
        getter: 'Some value',
        setter: () => {},
        caller: () => {},
      };
      expect(propsInjector(data, {})).toEqual(data);
    });
  });

  describe('WHEN the props contain an injected string', () => {
    it('SHOULD return correct props', () => {
      const props = propTypes.tree({
        name: types.string,
        injectedName: propTypes.injected(),
      });
      const requiredProps = propTypes.tree({
        injectedName: types.string,
      });
      const propsInjector = buildPropsInjector(props, requiredProps);
      const data = {
        name: 'Test name',
      };
      const injectedData = {
        injectedName: 'test injected name',
      };
      expect(propsInjector(data, injectedData)).toEqual({
        name: 'Test name',
        injectedName: 'test injected name',
      });
    });
  });

  describe('WHEN the props contain an injected string from a specific path', () => {
    it('SHOULD return correct props', () => {
      const props = propTypes.tree({
        name: types.string,
        injectedName: propTypes.injected('nested', 'name'),
      });
      const requiredProps = propTypes.tree({
        nested: propTypes.tree({
          name: types.string,
        }),
      });
      const propsInjector = buildPropsInjector(props, requiredProps);
      const data = {
        name: 'Test name',
      };
      const injectedData = {
        nested: {
          name: 'test injected name',
        },
      };
      expect(propsInjector(data, injectedData)).toEqual({
        name: 'Test name',
        injectedName: 'test injected name',
      });
    });
  });
});
