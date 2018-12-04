import { Migration } from '../nodes/migrations/types';

export interface TestDefinition {
  before: any;
  after: any;
  afterDowngrade?: any;
}

export default function createMigrationTester(migration: Migration) {
  return (description: string, definition: TestDefinition) => {
    const requestBefore = {
      version: migration.versionAfterDowngrade,
      graph: definition.before,
    };
    const requestAfter = {
      version: migration.versionAfterUpgrade,
      graph: definition.after,
    };
    const requestAfterDowngrade = {
      version: migration.versionAfterDowngrade,
      graph: definition.afterDowngrade,
    };

    describe(description, () => {
      it('SHOULD correctly perform the upgrade', () => {
        expect(migration.upgrade(requestBefore)).toEqual(requestAfter);
      });

      it('SHOULD correctly perform the downgrade', () => {
        const expectedValue = migration.unwrapMetadataAfterDowngrading
          ? definition.afterDowngrade || definition.before
          : definition.afterDowngrade
            ? requestAfterDowngrade
            : requestBefore;
        expect(migration.downgrade(requestAfter)).toEqual(expectedValue);
      });
    });
  };
}
