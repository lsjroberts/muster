import { SerializedNodeDefinition } from '../../types/graph';

export interface GraphWithMetadata {
  version: string;
  graph: SerializedNodeDefinition | any;
}

export interface Migration {
  match: string;
  versionAfterDowngrade: string;
  versionAfterUpgrade: string;
  unwrapMetadataAfterDowngrading?: boolean;
  upgrade(graph: GraphWithMetadata): GraphWithMetadata;
  downgrade(graph: GraphWithMetadata): GraphWithMetadata | any;
}
