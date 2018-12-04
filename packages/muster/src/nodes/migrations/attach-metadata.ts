const musterVersion = require('@dws/muster-version');
import { GraphWithMetadata } from './types';

export function attachMetadata(graph: any): GraphWithMetadata {
  return {
    version: musterVersion,
    graph,
  };
}
