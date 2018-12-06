import {
  createNodeDefinition,
  createNodeType,
  error,
  GraphNode,
  isNodeDefinition,
  NodeDefinition,
  StatelessGraphNode,
  StatelessNodeDefinition,
  StatelessNodeType,
} from '@dws/muster';

export const GLOBAL_ROOT_NODE = '$$container:globalRoot:node';

export interface GlobalRootNode
  extends StatelessGraphNode<'global-root', GlobalRootNodeProperties> {}

/**
 * A type of a [[GraphNode]] used for extracting a root of the global Muster graph. In Muster, each
 * component has its own local graph with a separate root. This node serves as a bridge between
 * README.md to learn more.
 * local graph and global graph. See the **Referencing global graph** example from Muster React
 */
export interface GlobalRootNodeDefinition
  extends StatelessNodeDefinition<'global-root', GlobalRootNodeProperties> {}

export interface GlobalRootNodeProperties {}

/**
 * The implementation of the [[GlobalRootNode]].
 * See the [[GlobalRootNode]] documentation to learn more.
 */
export const GlobalRootNodeType: StatelessNodeType<
  'global-root',
  GlobalRootNodeProperties
> = createNodeType<'global-root', GlobalRootNodeProperties>('global-root', {
  shape: {},
  operations: {
    evaluate: {
      run(node: GlobalRootNode): NodeDefinition | GraphNode {
        if (!(GLOBAL_ROOT_NODE in node.context.values)) {
          return error('Global root node is not available.');
        }
        return node.context.values[GLOBAL_ROOT_NODE];
      },
    },
  },
});

/**
 * Creates a new instance of a [[GlobalRootNode]].
 * See the [[GlobalRootNode]] documentation to learn more.
 * @returns {GlobalRootNode}
 */
export function globalRoot(): GlobalRootNodeDefinition {
  return createNodeDefinition(GlobalRootNodeType, {});
}

export function isGlobalRootNodeDefinition(value: any): value is GlobalRootNodeDefinition {
  return isNodeDefinition(value) && value.type === GlobalRootNodeType;
}
