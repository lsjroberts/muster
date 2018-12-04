import {
  ErrorNode,
  ErrorNodeDefinition,
  isErrorNodeDefinition,
  MusterError,
} from '../nodes/graph/error';
import { graphNode } from '../nodes/graph/graph-node';
import { isNilNodeDefinition, NilNode, NilNodeDefinition } from '../nodes/graph/nil';
import { isOkNodeDefinition, OkNode, OkNodeDefinition } from '../nodes/graph/ok';
import { isQuoteNodeDefinition, QuoteNode, QuoteNodeDefinition } from '../nodes/graph/quote';
import { isValueNodeDefinition, ValueNode, ValueNodeDefinition } from '../nodes/graph/value';
import {
  GraphNode,
  isGraphNode,
  NodeDefinition,
  PROXIED_NODE,
  PROXIED_NODE_DEFINITION,
} from '../types/graph';

export type DataNode = ValueNode<any> | OkNode | NilNode | QuoteNode | ErrorNode;
export type DataNodeDefinition =
  | ValueNodeDefinition<any>
  | OkNodeDefinition
  | NilNodeDefinition
  | QuoteNodeDefinition
  | ErrorNodeDefinition;

export function isDataNode(value: GraphNode): value is DataNode;
export function isDataNode(value: NodeDefinition): value is DataNodeDefinition;
export function isDataNode(
  value: NodeDefinition | GraphNode,
): value is DataNodeDefinition | DataNode;
export function isDataNode(
  value: NodeDefinition | GraphNode,
): value is DataNodeDefinition | DataNode {
  const definition = isGraphNode(value) ? value.definition : value;
  return (
    isValueNodeDefinition(definition) ||
    isOkNodeDefinition(definition) ||
    isNilNodeDefinition(definition) ||
    isQuoteNodeDefinition(definition) ||
    isErrorNodeDefinition(definition)
  );
}

export function valueOf(node: NodeDefinition | GraphNode): any {
  const definition = isGraphNode(node) ? node.definition : node;
  if (isQuoteNodeDefinition(definition)) return definition;
  if (isValueNodeDefinition(definition)) return definition.properties.value;
  if (isNilNodeDefinition(definition)) return undefined;
  if (isOkNodeDefinition(definition)) return undefined;
  if (isErrorNodeDefinition(definition)) {
    const { error, code, data, path, remotePath } = definition.properties;
    return MusterError.is(error)
      ? error
      : new MusterError(error, {
          code,
          data,
          path,
          remotePath,
        });
  }
  return new Proxy(node, {
    get(node, propName) {
      if (propName === PROXIED_NODE) return node;
      if (propName === PROXIED_NODE_DEFINITION) {
        return isGraphNode(node) ? graphNode(node) : node;
      }
      return undefined;
    },
  });
}
