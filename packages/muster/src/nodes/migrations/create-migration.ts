import { Migrator } from './create-migrator';
import { GraphWithMetadata, Migration } from './types';

export interface MigrationDefinition<B, A> {
  match: string;
  migrator: Migrator<B, A>;
  versionAfterDowngrade: string;
  versionAfterUpgrade: string;
  unwrapMetadataAfterDowngrading?: boolean;
}

export function createMigration<B, A>(config: MigrationDefinition<B, A>): Migration {
  return {
    match: config.match,
    versionAfterDowngrade: config.versionAfterDowngrade,
    versionAfterUpgrade: config.versionAfterUpgrade,
    unwrapMetadataAfterDowngrading: config.unwrapMetadataAfterDowngrading,
    upgrade(request: GraphWithMetadata): GraphWithMetadata {
      return {
        version: config.versionAfterUpgrade,
        graph: config.migrator.upgrade(request.graph),
      };
    },
    downgrade(request: GraphWithMetadata): GraphWithMetadata | any {
      const downgradedRequest = config.migrator.downgrade(request.graph);
      if (config.unwrapMetadataAfterDowngrading) {
        return downgradedRequest;
      }
      return {
        version: config.versionAfterDowngrade,
        graph: downgradedRequest,
      };
    },
  };
}
