import {
  GraphNode,
  NodeDefinition,
  StatelessGraphNode,
  StatelessNodeDefinition,
  StatelessNodeType,
} from '../../types/graph';
import createNodeDefinition from '../../utils/create-node-definition';
import { createNodeType } from '../../utils/create-node-type';
import { WILDCARD_OPERATION } from '../../utils/wildcard-operation';
import { value } from './value';

/**
 * An instance of the [[nil]] node.
 * See the [[nil]] documentation to find out more.
 */
export interface NilNode extends StatelessGraphNode<'nil'> {}

/**
 * A definition of the [[nil]] node.
 * See the [[nil]] documentation to find out more.
 */
export interface NilNodeDefinition extends StatelessNodeDefinition<'nil'> {}

/**
 * The implementation of the [[nil]].
 * See the [[nil]] documentation to learn more.
 */
export const NilNodeType: StatelessNodeType<'nil'> = createNodeType<'nil'>('nil', {
  operations: {
    evaluate: {
      run(): NodeDefinition {
        return value(undefined);
      },
    },
    [WILDCARD_OPERATION]: {
      run(node: NilNode): GraphNode {
        return node;
      },
    },
  },
});

const INSTANCE = createNodeDefinition(NilNodeType, {});

/**
 * Creates a new instance of a [[nil]] node, which is a type of a [[NodeDefinition]] used when returning a `null`
 * to subscribers. For simplicity, the [[nil]] resolves to a `value(null)`.
 */
export function nil(): NilNodeDefinition {
  return INSTANCE;
}

export function isNilNodeDefinition(value: NodeDefinition): value is NilNodeDefinition {
  return value.type === NilNodeType;
}
