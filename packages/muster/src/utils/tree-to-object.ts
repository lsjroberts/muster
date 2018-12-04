import fromPairs from 'lodash/fromPairs';
import {
  ArrayNode,
  ArrayNodeDefinition,
  ArrayNodeType,
  isArrayNodeDefinition,
} from '../nodes/collection/array';
import { ErrorNodeType, isErrorNodeDefinition, MusterError } from '../nodes/graph/error';
import { isNilNodeDefinition, NilNodeType } from '../nodes/graph/nil';
import { isOkNodeDefinition, OkNodeType } from '../nodes/graph/ok';
import { isQuoteNodeDefinition, QuoteNodeType } from '../nodes/graph/quote';
import {
  isTreeNodeDefinition,
  TreeNode,
  TreeNodeDefinition,
  TreeNodeType,
} from '../nodes/graph/tree';
import { isValueNodeDefinition, ValueNodeType } from '../nodes/graph/value';
import { GraphNode, isGraphNode, NodeDefinition } from '../types/graph';
import { deprecated } from './deprecated';
import { getInvalidTypeError } from './get-invalid-type-error';
import { DataNode, DataNodeDefinition, isDataNode } from './value-of';

export type LegacyDataNode = DataNode | TreeNode | ArrayNode;
export type LegacyDataNodeDefinition =
  | DataNodeDefinition
  | TreeNodeDefinition
  | ArrayNodeDefinition;

export function isLegacyDataNode(value: GraphNode): value is LegacyDataNode;
export function isLegacyDataNode(value: NodeDefinition): value is LegacyDataNodeDefinition;
export function isLegacyDataNode(
  value: NodeDefinition | GraphNode,
): value is LegacyDataNodeDefinition | LegacyDataNode;
export function isLegacyDataNode(
  value: NodeDefinition | GraphNode,
): value is LegacyDataNodeDefinition | LegacyDataNode {
  const definition = isGraphNode(value) ? value.definition : value;
  return (
    isDataNode(definition) || isTreeNodeDefinition(definition) || isArrayNodeDefinition(definition)
  );
}

const treeToObjectDeprecationWarning = deprecated({
  old: 'treeToObject',
  new: 'valueOf',
});

/**
 * Converts a muster node to a JavaScript object
 * @param value
 * @deprecated
 */
export function treeToObject(value: DataNodeDefinition): any {
  treeToObjectDeprecationWarning();
  if (isQuoteNodeDefinition(value)) return value;
  if (isValueNodeDefinition(value)) return value.properties.value;
  if (isNilNodeDefinition(value)) return undefined;
  if (isOkNodeDefinition(value)) return undefined;
  if (isTreeNodeDefinition(value)) {
    return fromPairs(
      value.properties.branches
        .filter(({ match }) => typeof match === 'string' || typeof match === 'number')
        .map(({ match, node }) => [match, treeToObject(node)] as [string | number, NodeDefinition]),
    );
  }
  if (isArrayNodeDefinition(value)) {
    return value.properties.items.map(treeToObject);
  }
  if (isErrorNodeDefinition(value)) {
    const { error, code, data, path, remotePath } = value.properties;
    return MusterError.is(error)
      ? error
      : new MusterError(error, {
          code,
          data,
          path,
          remotePath,
        });
  }
  const error = getInvalidTypeError(
    ['Could not convert node to object.', 'Unsupported node type encountered.'].join('\n'),
    {
      expected: [
        ValueNodeType,
        TreeNodeType,
        ArrayNodeType,
        OkNodeType,
        ErrorNodeType,
        NilNodeType,
        QuoteNodeType,
      ],
      received: value,
    },
  );
  console.warn(error.message);
  return value;
}
