import camelCase from 'lodash/camelCase';

import {
  NODE_DEFINITION,
  NodeData,
  NodeDefinition,
  NodeName,
  NodeProperties,
  NodeState,
  NodeType,
  SerializedNodeProperties,
  StatefulNodeDefinition,
  StatefulNodeType,
  StatelessNodeDefinition,
  StatelessNodeType,
  StaticNodeDefinition,
  StaticNodeType,
} from '../types/graph';
import { string as hashString } from './hash';

/* tslint:disable:max-line-length */
export default function createNodeDefinition<
  T extends NodeName,
  P extends NodeProperties,
  V extends SerializedNodeProperties = P,
  N extends StaticNodeType<T, P, V> = StaticNodeType<T, P, V>
>(nodeType: N, properties: P): StaticNodeDefinition<T, P, V, N>;
export default function createNodeDefinition<
  T extends NodeName,
  P extends NodeProperties,
  V extends SerializedNodeProperties = P,
  N extends StatelessNodeType<T, P, V> = StatelessNodeType<T, P, V>
>(nodeType: N, properties: P): StatelessNodeDefinition<T, P, V, N>;
export default function createNodeDefinition<
  T extends NodeName,
  P extends NodeProperties,
  S extends NodeState,
  D extends NodeData,
  V extends SerializedNodeProperties = P,
  N extends StatefulNodeType<T, P, S, D, V> = StatefulNodeType<T, P, S, D, V>
>(nodeType: N, properties: P): StatefulNodeDefinition<T, P, S, D, V, any, any, N>;
/* tslint:enable:max-line-length */
export default function createNodeDefinition<
  T extends NodeName,
  P extends NodeProperties,
  S extends NodeState,
  D extends NodeData,
  V extends SerializedNodeProperties,
  N extends NodeType<T, P, S, D, V>
>(nodeType: N, properties: P): NodeDefinition<T, P, S, D, V, N> {
  if (!nodeType.shape(properties)) {
    throw new Error(`${camelCase(nodeType.name)}() node factory was called with invalid arguments`);
  }
  return {
    [NODE_DEFINITION]: true,
    id: `${nodeType.name}:${hashString(nodeType.hash(properties))}`,
    type: nodeType,
    properties,
  };
}
