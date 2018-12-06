import {
  isNodeDefinition,
  NodeDefinition,
  NodeLike,
  StaticGraphNode,
  StaticNodeDefinition,
  StaticNodeType,
} from '../../types/graph';
import createNodeDefinition from '../../utils/create-node-definition';
import { createNodeType } from '../../utils/create-node-type';
import * as graphTypes from '../../utils/graph-types';
import * as types from '../../utils/types';
import { EntriesNodeDefinition } from './entries';
import { fields, FieldSetDefinition, FieldsNodeDefinition } from './fields';
import { value } from './value';
import { WithTransformsNodeDefinition } from './with-transforms';

/**
 * An instance of the [[key]] node.
 * See the [[key]] documentation to find out more.
 */
export interface KeyNode extends StaticGraphNode<'key', KeyNodeProperties> {}

/**
 * A definition of the [[key]] node.
 * See the [[key]] documentation to find out more.
 */
export interface KeyNodeDefinition extends StaticNodeDefinition<'key', KeyNodeProperties> {}

export interface KeyNodeProperties {
  key: NodeDefinition;
  children?: FieldsNodeDefinition | EntriesNodeDefinition | WithTransformsNodeDefinition;
}

/**
 * The implementation of the [[key]] node.
 * See the [[key]] documentation to learn more.
 */
export const KeyNodeType: StaticNodeType<'key', KeyNodeProperties> = createNodeType<
  'key',
  KeyNodeProperties
>('key', {
  shape: {
    key: graphTypes.nodeDefinition,
    children: types.optional(graphTypes.nodeDefinition),
  },
});

/**
 * Creates a new instance of a [[key]] node, which is a type of a [[NodeDefinition]] used as part of a [[query]]
 * to declare what node should be retrieved from the graph. A key can contain children.
 * See the **Basic query** example from the [[query]] documentation to learn more.
 */
export function key(
  key: NodeDefinition | NodeLike,
  children?:
    | EntriesNodeDefinition
    | FieldsNodeDefinition
    | FieldSetDefinition
    | WithTransformsNodeDefinition,
): KeyNodeDefinition {
  return createNodeDefinition(KeyNodeType, {
    key: isNodeDefinition(key) ? key : value(key),
    children: sanitizeChildren(children),
  } as KeyNodeProperties);
}

export function isKeyNodeDefinition(value: NodeDefinition): value is KeyNodeDefinition {
  return value.type === KeyNodeType;
}

function sanitizeChildren(
  children:
    | EntriesNodeDefinition
    | FieldsNodeDefinition
    | FieldSetDefinition
    | WithTransformsNodeDefinition
    | undefined,
): EntriesNodeDefinition | FieldsNodeDefinition | WithTransformsNodeDefinition | undefined {
  if (!children) {
    return undefined;
  }
  if (isNodeDefinition(children)) {
    return children;
  }
  return fields(children);
}
