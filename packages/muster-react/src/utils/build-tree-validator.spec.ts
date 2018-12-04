import { types } from '@dws/muster';
import { propTypes } from '../types';
import { buildTreeValidator, TreeValidator } from './build-tree-validator';

describe('buildTreeValidator()', () => {
  describe('WHEN called with an empty tree', () => {
    let validator: TreeValidator;

    beforeEach(() => {
      validator = buildTreeValidator(propTypes.tree({}));
    });

    it('SHOULD return a function', () => {
      expect(validator).toEqual(expect.any(Function));
    });

    describe('AND then called with an empty object', () => {
      it('SHOULD return empty array of errors', () => {
        expect(validator({})).toEqual([]);
      });
    });

    describe('AND then called with an object containing some props', () => {
      it('SHOULD return no errors', () => {
        expect(
          validator({
            name: 'hello',
          }),
        ).toEqual([]);
      });
    });
  });

  describe('WHEN called with a tree containing a getter', () => {
    let validator: TreeValidator;

    beforeEach(() => {
      validator = buildTreeValidator(
        propTypes.tree({
          name: propTypes.getter(types.string),
        }),
      );
    });

    it('SHOULD return a function', () => {
      expect(validator).toEqual(expect.any(Function));
    });

    describe('AND then called with an empty object', () => {
      it('SHOULD return an error', () => {
        expect(validator({})).toEqual([new Error(`Property 'name' - Invalid value: undefined`)]);
      });
    });

    describe('AND then called with an object containing invalid value of the property `name`', () => {
      it('SHOULD return an error', () => {
        expect(validator({ name: 123 })).toEqual([
          new Error(`Property 'name' - Invalid value: 123`),
        ]);
      });
    });

    describe('AND then called with an object containing correct value', () => {
      it('SHOULD return no errors', () => {
        expect(validator({ name: 'Bob ' })).toEqual([]);
      });
    });

    describe('AND then called with an object containing correct value with additional properties', () => {
      it('SHOULD return no errors', () => {
        expect(
          validator({
            name: 'Bob',
            additional: 123,
          }),
        ).toEqual([]);
      });
    });
  });
});
