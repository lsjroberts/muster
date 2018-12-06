import { GraphNode, NodeDefinition } from '../../../types/graph';
import {
  FirstNode,
  FirstNodeDefinition,
  FirstNodeType,
  isFirstNodeDefinition,
} from '../keys/first';
import { isLastNodeDefinition, LastNode, LastNodeDefinition, LastNodeType } from '../keys/last';
import {
  isLengthNodeDefinition,
  LengthNode,
  LengthNodeDefinition,
  LengthNodeType,
} from '../keys/length';
import { isNthNodeDefinition, NthNode, NthNodeDefinition, NthNodeType } from '../keys/nth';

export type ListKeyNodeDefinition =
  | FirstNodeDefinition
  | LastNodeDefinition
  | LengthNodeDefinition
  | NthNodeDefinition;

export type ListKeyNode = FirstNode | LastNode | LengthNode | NthNode;

export function isListKeyNode(value: GraphNode): value is ListKeyNode {
  return (
    FirstNodeType.is(value) ||
    LastNodeType.is(value) ||
    LengthNodeType.is(value) ||
    NthNodeType.is(value)
  );
}

export function isListKeyNodeDefinition(value: NodeDefinition): value is ListKeyNodeDefinition {
  return (
    isFirstNodeDefinition(value) ||
    isLastNodeDefinition(value) ||
    isLengthNodeDefinition(value) ||
    isNthNodeDefinition(value)
  );
}
