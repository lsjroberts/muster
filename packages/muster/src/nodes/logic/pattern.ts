import { NodeDefinition } from '../../types/graph';
import { fn, FnNodeDefinition } from '../graph/fn';

export function pattern(
  factory: (placeholder: NodeDefinition) => NodeDefinition,
): FnNodeDefinition {
  return fn(factory);
}
