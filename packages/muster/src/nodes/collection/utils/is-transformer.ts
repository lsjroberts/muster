import { GraphNode, NodeDefinition } from '../../../types/graph';
import {
  InitableGraphNode,
  InitableNodeDefinition,
  supportsInitOperation,
} from '../operations/init';
import {
  ResultableGraphNode,
  ResultableNodeDefinition,
  supportsResultOperation,
} from '../operations/result';
import {
  SteppableGraphNode,
  SteppableNodeDefinition,
  supportsStepOperation,
} from '../operations/step';

export type TransformerGraphNode = InitableGraphNode | SteppableGraphNode | ResultableGraphNode;
export type TransformerNodeDefinition =
  | InitableNodeDefinition
  | SteppableNodeDefinition
  | ResultableNodeDefinition;

export default function isTransformer(value: NodeDefinition): value is TransformerNodeDefinition;
export default function isTransformer(value: GraphNode): value is TransformerGraphNode;
export default function isTransformer(
  value: GraphNode | NodeDefinition,
): value is TransformerGraphNode | TransformerNodeDefinition;
export default function isTransformer(
  value: GraphNode | NodeDefinition,
): value is TransformerGraphNode | TransformerNodeDefinition {
  return (
    supportsInitOperation(value) || supportsStepOperation(value) || supportsResultOperation(value)
  );
}
