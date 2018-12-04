import {
  isNodeDefinition,
  NodeDefinition,
  StaticGraphNode,
  StaticNodeDefinition,
  StaticNodeType,
} from '../../types/graph';
import createNodeDefinition from '../../utils/create-node-definition';
import { createNodeType } from '../../utils/create-node-type';
import * as graphTypes from '../../utils/graph-types';
import * as types from '../../utils/types';
import { fields, FieldSetDefinition, FieldsNodeDefinition } from './fields';
import { WithTransformsNodeDefinition } from './with-transforms';

/**
 * An instance of the [[entries]] node.
 * See the [[entries]] documentation to find out more.
 */
export interface EntriesNode extends StaticGraphNode<'entries', EntriesNodeProperties> {}

/**
 * A definition of the [[entries]] node.
 * See the [[entries]] documentation to find out more.
 */
export interface EntriesNodeDefinition
  extends StaticNodeDefinition<'entries', EntriesNodeProperties> {}

export interface EntriesNodeProperties {
  children?: EntriesNodeDefinition | WithTransformsNodeDefinition | FieldsNodeDefinition;
}

/**
 * The implementation of the [[entries]].
 * See the [[entries]] documentation to learn more.
 */
export const EntriesNodeType: StaticNodeType<'entries', EntriesNodeProperties> = createNodeType<
  'entries',
  EntriesNodeProperties
>('entries', {
  shape: {
    children: types.optional(graphTypes.nodeDefinition),
  },
});

/**
 * Creates a new instance of a [[entries]] node, which is a type of a [[NodeDefinition]] used as part of a [[query]]
 * to define that a given key should be loaded as a collection.
 * See **Getting atomic items from a collection** and **Getting specific fields from items** examples from [[query]] to learn more.
 */
export function entries(
  children?:
    | FieldsNodeDefinition
    | EntriesNodeDefinition
    | WithTransformsNodeDefinition
    | FieldSetDefinition
    | undefined,
): EntriesNodeDefinition {
  return createNodeDefinition(EntriesNodeType, {
    children: sanitizeChildren(children),
  } as EntriesNodeProperties);
}

export function isEntriesNodeDefinition(array: NodeDefinition): array is EntriesNodeDefinition {
  return array.type === EntriesNodeType;
}

function sanitizeChildren(
  children:
    | FieldsNodeDefinition
    | EntriesNodeDefinition
    | WithTransformsNodeDefinition
    | FieldSetDefinition
    | undefined,
): EntriesNodeDefinition | WithTransformsNodeDefinition | FieldsNodeDefinition | undefined {
  if (!children) {
    return undefined;
  }
  if (isNodeDefinition(children)) return children;
  return fields(children);
}
