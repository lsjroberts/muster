import { GraphWithMetadata } from './types';

export function toGraphWithMetadata(graph: any): GraphWithMetadata {
  if (typeof graph.version === 'undefined') {
    return {
      version: '5.0.0',
      graph,
    };
  }
  return graph;
}
