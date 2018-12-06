import { satisfies } from 'semver';
import migrationsInOrder from './migrations-in-order';
import { GraphWithMetadata } from './types';

// It assumes the target version should be the latest version

export function upgradeGraph(graph: GraphWithMetadata): GraphWithMetadata {
  const firstMatchingMigration = migrationsInOrder.findIndex((migration) =>
    satisfies(graph.version, migration.match),
  );
  if (firstMatchingMigration === -1) return graph;
  const remainingMigrations = migrationsInOrder.slice(firstMatchingMigration);
  return remainingMigrations.reduce((request, migration) => migration.upgrade(request), graph);
}
