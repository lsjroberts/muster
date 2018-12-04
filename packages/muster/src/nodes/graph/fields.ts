import mapValues from 'lodash/mapValues';
import {
  isGraphNode,
  isNodeDefinition,
  NodeDefinition,
  StaticGraphNode,
  StaticNodeDefinition,
  StaticNodeType,
} from '../../types/graph';
import createNodeDefinition from '../../utils/create-node-definition';
import { createNodeType } from '../../utils/create-node-type';
import { getInvalidTypeError } from '../../utils/get-invalid-type-error';
import * as graphTypes from '../../utils/graph-types';
import * as types from '../../utils/types';
import {
  CatchErrorNodeDefinition,
  CatchErrorNodeType,
  isCatchErrorNodeDefinition,
} from './catch-error';
import {
  CreateCallerNodeDefinition,
  CreateCallerNodeType,
  isCreateCallerNodeDefinition,
} from './create-caller';
import {
  CreateSetterNodeDefinition,
  CreateSetterNodeType,
  isCreateSetterNodeDefinition,
} from './create-setter';
import { DeferNodeDefinition, DeferNodeType, isDeferNodeDefinition } from './defer';
import { EntriesNodeDefinition, EntriesNodeType, isEntriesNodeDefinition } from './entries';
import {
  isIsPendingNodeDefinition,
  IsPendingNodeDefinition,
  IsPendingNodeType,
} from './is-pending';
import { isKeyNodeDefinition, key, KeyNodeDefinition, KeyNodeType } from './key';
import {
  isWithTransformsNodeDefinition,
  WithTransformsNodeDefinition,
  WithTransformsNodeType,
} from './with-transforms';

export type ChildKeyDefinition =
  | KeyNodeDefinition
  | DeferNodeDefinition
  | IsPendingNodeDefinition
  | CreateSetterNodeDefinition
  | CreateCallerNodeDefinition
  | CatchErrorNodeDefinition;

export type FieldSetDefinition = {
  [id: string]: FieldDefinition;
};

export type FieldDefinition =
  | true
  | FieldsNodeDefinition
  | EntriesNodeDefinition
  | WithTransformsNodeDefinition
  | KeyNodeDefinition
  | DeferNodeDefinition
  | IsPendingNodeDefinition
  | CreateSetterNodeDefinition
  | CreateCallerNodeDefinition
  | FieldSetDefinition
  | CatchErrorNodeDefinition;

export interface FieldsNodeProperties {
  fields: {
    [id: string]: ChildKeyDefinition;
  };
}

export interface SerializedFieldsNodeProperties<T = any> {
  fields: {
    [id: string]: T;
  };
}

/**
 * An instance of the [[fields]] node.
 * See the [[fields]] documentation to find out more.
 */
export interface FieldsNode
  extends StaticGraphNode<'fields', FieldsNodeProperties, SerializedFieldsNodeProperties> {}

/**
 * A definition of the [[fields]] node.
 * See the [[fields]] documentation to find out more.
 */
export interface FieldsNodeDefinition
  extends StaticNodeDefinition<'fields', FieldsNodeProperties, SerializedFieldsNodeProperties> {}

/**
 * The implementation of the [[fields]] node.
 * See the [[fields]] documentation to learn more.
 */
export const FieldsNodeType: StaticNodeType<
  'fields',
  FieldsNodeProperties,
  SerializedFieldsNodeProperties
> = createNodeType<'fields', FieldsNodeProperties, SerializedFieldsNodeProperties>('fields', {
  shape: {
    fields: types.objectOf(graphTypes.nodeDefinition),
  },
  serialize<T>(
    { fields }: FieldsNodeProperties,
    serialize: (node: NodeDefinition) => T,
  ): SerializedFieldsNodeProperties<T> {
    return {
      fields: mapValues(fields, (field) => serialize(field)),
    };
  },
  deserialize<T>(
    { fields }: SerializedFieldsNodeProperties<T>,
    deserialize: (node: T) => NodeDefinition,
  ): FieldsNodeProperties {
    return {
      fields: mapValues(fields, (field) => deserialize(field)),
    };
  },
});

/**
 * Creates a new instance of a [[fields]] node, which is a type of a [[NodeDefinition]] used inside of
 * a [[query]] to represent a nested graph structures. It serves as a container for a following graph nodes:
 * - [key](_nodes_graph_key_.html#key)
 * - [[defer]]
 * - [[isPending]]
 * - [[createCaller]]
 * - [[createSetter]]
 *
 * Muster is performing implicit conversion to this node type every time a query or a key node with
 * fields is created.
 *
 *
 * @example **Implicit conversion in [[query]]**
 * ```js
 * import { fields, key, query, root } from '@dws/muster';
 *
 * query(root(), {
 *   firstName: key('firstName'),
 *   lastName: key('lastName'),
 * });
 * // is equivalent to
 * query(root(), fields({
 *   firstName: key('firstName'),
 *   lastName: key('lastName'),
 * }));
 * ```
 * This example shows how Muster implicitly converts an object to a [[fields]] when creating
 * a [[query]] with child fields.
 *
 *
 * @example **Implicit conversion in [key](_nodes_graph_key_.html#key)**
 * ```js
 * import { fields, key } from '@dws/muster';
 *
 * key('someKey', {
 *   firstName: key('firstName'),
 *   lastName: key('lastName'),
 * });
 * // is equivalent to
 * key('someKey', fields({
 *   firstName: key('firstName'),
 *   lastName: key('lastName'),
 * }));
 * ```
 * This example shows how Muster implicitly converts an object to a [[fields]] when creating
 * a [key](_nodes_graph_key_.html#key) with child fields.
 *
 *
 * @example **Implicit conversion in [[entries]]**
 * ```js
 * import { fields, key, entries } from '@dws/muster';
 *
 * entries({
 *   firstName: key('firstName'),
 *   lastName: key('lastName'),
 * });
 * // is equivalent to
 * entries(fields({
 *   firstName: key('firstName'),
 *   lastName: key('lastName'),
 * }));
 * ```
 * This example shows how Muster implicitly converts an object to a [[fields]] when creating
 * an [[entries]] with child fields.
 */
export function fields(fieldSet: FieldSetDefinition): FieldsNodeDefinition {
  return createNodeDefinition<'fields', FieldsNodeProperties, SerializedFieldsNodeProperties>(
    FieldsNodeType,
    {
      fields: mapValues(fieldSet, parseFieldDefinition),
    },
  );
}

export function isFieldsNodeDefinition(value: NodeDefinition): value is FieldsNodeDefinition {
  return value.type === FieldsNodeType;
}

function parseFieldDefinition(
  value: FieldDefinition,
  childKey: string,
):
  | KeyNodeDefinition
  | IsPendingNodeDefinition
  | DeferNodeDefinition
  | CreateSetterNodeDefinition
  | CreateCallerNodeDefinition
  | CatchErrorNodeDefinition {
  if (value === true) {
    return key(childKey);
  }
  if (isNodeDefinition(value)) {
    if (isFieldsNodeDefinition(value) || isCollectionFieldsNodeDefinition(value)) {
      return key(childKey, value);
    }
    if (
      isKeyNodeDefinition(value) ||
      isDeferNodeDefinition(value) ||
      isIsPendingNodeDefinition(value) ||
      isCreateSetterNodeDefinition(value) ||
      isCreateCallerNodeDefinition(value) ||
      isCatchErrorNodeDefinition(value)
    ) {
      return value;
    }
  }
  if (!value || typeof value !== 'object' || isGraphNode(value) || isNodeDefinition(value)) {
    throw getInvalidTypeError(`Invalid field definition for key "${childKey}"`, {
      expected: [
        'true',
        '{}',
        FieldsNodeType,
        EntriesNodeType,
        WithTransformsNodeType,
        KeyNodeType,
        DeferNodeType,
        CreateSetterNodeType,
        CreateCallerNodeType,
        CatchErrorNodeType,
        IsPendingNodeType,
      ],
      received: value,
    });
  }
  return key(childKey, mapValues(value, parseFieldDefinition));
}

function isCollectionFieldsNodeDefinition(
  value: NodeDefinition,
): value is EntriesNodeDefinition | WithTransformsNodeDefinition {
  return isEntriesNodeDefinition(value) || isWithTransformsNodeDefinition(value);
}
