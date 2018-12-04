import { CallOperation, isCallArgumentArray } from '../../operations/call';
import {
  GraphNode,
  NodeDefinition,
  StatelessGraphNode,
  StatelessNodeDefinition,
  StatelessNodeType,
} from '../../types/graph';
import createNodeDefinition from '../../utils/create-node-definition';
import { createNodeType } from '../../utils/create-node-type';
import { nil } from './nil';

/**
 * An instance of the [[identity]] node.
 * See the [[identity]] documentation to learn more.
 */
export interface IdentityNode extends StatelessGraphNode<'identity', IdentityNodeProperties> {}

/**
 * A definition of the [[identity]] node.
 * See the [[identity]] documentation to learn more.
 */
export interface IdentityNodeDefinition
  extends StatelessNodeDefinition<'identity', IdentityNodeProperties> {}

export interface IdentityNodeProperties {}

/**
 * The implementation of the [[identity]].
 * See the [[identity]] documentation to learn more.
 */
export const IdentityNodeType: StatelessNodeType<
  'identity',
  IdentityNodeProperties
> = createNodeType<'identity', IdentityNodeProperties>('identity', {
  shape: {},
  operations: {
    call: {
      run(node: IdentityNode, operation: CallOperation): GraphNode | NodeDefinition {
        const { args } = operation.properties;
        if (!args) return nil();
        if (isCallArgumentArray(args)) return args[0];
        const argsNames = Object.keys(args);
        return args[argsNames[0]];
      },
    },
  },
});

const INSTANCE = createNodeDefinition(IdentityNodeType, {});

/**
 * Creates a new instance of a [[identity]] node, which works in the same way as an `identity` function
 * from `lodash`. It implements a `call` operation that returns a first argument it was called with.
 */
export function identity(): IdentityNodeDefinition {
  return INSTANCE;
}

export function isIdentityNodeDefinition(value: NodeDefinition): value is IdentityNodeDefinition {
  return value.type === IdentityNodeType;
}
