import { satisfies } from 'semver';
import migrationsInOrder from './migrations-in-order';
import { GraphWithMetadata } from './types';

// It assumes the request is in the latest version
// Not 100% that's correct

export function downgradeGraph(graph: GraphWithMetadata, targetVersion: string): GraphWithMetadata {
  const firstMatchingMigration = migrationsInOrder.findIndex((migration) =>
    satisfies(targetVersion, migration.match),
  );
  if (firstMatchingMigration === -1) return graph;
  const remainingMigrations = migrationsInOrder.slice(firstMatchingMigration);
  return remainingMigrations
    .reverse()
    .reduce((request, migration) => migration.downgrade(request), graph);
}
