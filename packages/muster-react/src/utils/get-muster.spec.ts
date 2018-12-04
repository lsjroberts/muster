import { Muster } from '@dws/muster';
import getMuster from './get-muster';

describe('getMuster', () => {
  const muster: Muster = ({} as any) as Muster;
  const ComponentName = 'TestComponent';
  const errorMessage = [
    `A muster-react component "${ComponentName}" must be wrapped in a Provider with a valid Muster instance:`,
    '  <Provider muster={<<valid_muster_instance>>}>',
    `    <${ComponentName} ... />`,
    '  </Provider>',
  ].join('\n');

  describe('WHEN calling with null props and context', () => {
    it('SHOULD throw an error', () => {
      expect(() => getMuster(ComponentName, null as any)).toThrow(errorMessage);
    });
  });

  describe('WHEN calling with props without muster', () => {
    it('SHOULD throw an error', () => {
      expect(() => getMuster(ComponentName, {} as any)).toThrow(errorMessage);
    });
  });

  describe('WHEN calling with props containing muster', () => {
    it('SHOULD return that muster', () => {
      expect(getMuster(ComponentName, { muster })).toBe(muster);
    });
  });

  describe('WHEN calling with context without muster', () => {
    it('SHOULD throw an error', () => {
      expect(() => getMuster(ComponentName, undefined as any, {})).toThrow(errorMessage);
    });
  });

  describe('WHEN calling with context containing muster', () => {
    it('SHOULD return that muster', () => {
      expect(getMuster(ComponentName, undefined as any, { muster })).toBe(muster);
    });
  });

  describe('WHEN both props and context has muster', () => {
    it('SHOULD return the muster from props', () => {
      const otherMuster = ({} as any) as Muster;
      const returnedMuster = getMuster(ComponentName, { muster }, { muster: otherMuster });
      expect(returnedMuster).toBe(muster);
      expect(returnedMuster).not.toBe(otherMuster);
    });
  });
});
