import mapValues from 'lodash/mapValues';
import { getInvalidTypeError } from '../../utils/get-invalid-type-error';

// B = before
// A = after
export interface Migrator<B, A> {
  upgrade(node: B): A;
  downgrade(node: A): B;
}

// B = before
// A = after
export interface MigratorDefinition<B, A> {
  upgrade?: (node: B, traverse: (node: any) => any) => A;
  downgrade?: (node: A, traverse: (node: any) => any) => B;
}

// B = before
// A = after
export interface MigratorsMap<B, A> {
  [key: string]: MigratorDefinition<B, A>;
}

export const DEFAULT: symbol = Symbol('DEFAULT');

// B = before
// A = after
export function createMigrator<B, A>(definition: MigratorsMap<B, A>): Migrator<B, A> {
  // TODO: Remove the `as any` cast once https://github.com/Microsoft/TypeScript/issues/1863 is resolved
  const defaultMigrator = definition[DEFAULT as any];
  if (!defaultMigrator) {
    throw new Error('DEFAULT migrator is missing.');
  }
  if (!defaultMigrator.downgrade) {
    throw new Error('DEFAULT migrator is missing the `downgrade` step.');
  }
  if (!defaultMigrator.upgrade) {
    throw new Error('DEFAULT migrator is missing the `upgrade` step.');
  }
  function upgradeAnyObject(obj: any): any {
    if (!obj) return obj;
    if (Array.isArray(obj)) return obj.map(upgradeAnyObject);
    if (typeof obj === 'object' && obj !== null) {
      if (typeof obj.$type === 'string') return upgrade(obj);
      return mapValues(obj, upgradeAnyObject);
    }
    return obj;
  }

  function downgradeAnyObject(obj: any): any {
    if (!obj) return obj;
    if (Array.isArray(obj)) return obj.map(downgradeAnyObject);
    if (typeof obj === 'object' && obj !== null) {
      if (typeof obj.$type === 'string') return downgrade(obj);
      return mapValues(obj, downgradeAnyObject);
    }
    return obj;
  }

  function upgrade(obj: B): A {
    if (typeof obj !== 'object' || obj === null || typeof (obj as any).$type !== 'string') {
      throw getInvalidTypeError('Invalid type of a node passed to migrator.', {
        expected: '{$type: string, ...}',
        received: obj,
      });
    }
    const customMigrator = definition[(obj as any).$type];
    if (!customMigrator || !customMigrator.upgrade) {
      return defaultMigrator.upgrade!(obj, upgradeAnyObject);
    }
    return customMigrator.upgrade(obj, upgradeAnyObject);
  }

  function downgrade(obj: A): B {
    if (typeof obj !== 'object' || obj === null || typeof (obj as any).$type !== 'string') {
      throw getInvalidTypeError('Invalid type of a node passed to migrator.', {
        expected: '{$type: string, ...}',
        received: obj,
      });
    }
    const customMigrator = definition[(obj as any).$type];
    if (!customMigrator || !customMigrator.downgrade) {
      return defaultMigrator.downgrade!(obj, downgradeAnyObject);
    }
    return customMigrator.downgrade(obj, downgradeAnyObject);
  }

  return { upgrade, downgrade };
}
