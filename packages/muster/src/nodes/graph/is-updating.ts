import { supportsEvaluateOperation } from '../../operations/evaluate';
import { isUpdatingOperation, supportsIsUpdatingOperation } from '../../operations/is-updating';
import {
  GraphAction,
  GraphNode,
  NodeDefinition,
  NodeDependency,
  StatelessGraphNode,
  StatelessNodeDefinition,
  StatelessNodeType,
} from '../../types/graph';
import { getInvalidTypeErrorMessage } from '../../utils';
import createGraphAction from '../../utils/create-graph-action';
import createNodeDefinition from '../../utils/create-node-definition';
import { createNodeType } from '../../utils/create-node-type';
import * as graphTypes from '../../utils/graph-types';
import { value } from './value';

/**
 * An instance of the [[isUpdating]] node.
 * See the [[isUpdating]] documentation to find out more.
 */
export interface IsUpdatingNode
  extends StatelessGraphNode<'isUpdating', IsUpdatingNodeProperties> {}

/**
 * A definition of the [[isUpdating]] node.
 * See the [[isUpdating]] documentation to find out more.
 */
export interface IsUpdatingNodeDefinition
  extends StatelessNodeDefinition<'isUpdating', IsUpdatingNodeProperties> {}

export interface IsUpdatingNodeProperties {
  target: NodeDefinition;
}

/**
 * The implementation of the [[isUpdating]] node.
 * See the [[isUpdating]] documentation to learn more.
 */
export const IsUpdatingNodeType: StatelessNodeType<
  'isUpdating',
  IsUpdatingNodeProperties
> = createNodeType<'isUpdating', IsUpdatingNodeProperties>('isUpdating', {
  shape: {
    target: graphTypes.nodeDefinition,
  },
  operations: {
    evaluate: {
      getDependencies({ target }: IsUpdatingNodeProperties): Array<NodeDependency> {
        return [
          {
            target,
            until: untilSupportsIsUpdatingOperationOrStaticNode,
          },
        ];
      },
      run(
        node: IsUpdatingNode,
        operation: never,
        [target]: [GraphNode],
      ): NodeDefinition | GraphAction {
        if (!supportsIsUpdatingOperation(target)) {
          return value(true);
        }
        return createGraphAction(target, isUpdatingOperation());
      },
    },
  },
});

/**
 * Creates an instance of the [[isUpdating]] node, which is used for checking if a node is updating
 * its value. For static nodes this always returns false, and for [[optimistic]] node it checks
 * if the value is returned optimistically.
 */
export function isUpdating(target: NodeDefinition): IsUpdatingNodeDefinition {
  return createNodeDefinition(IsUpdatingNodeType, { target });
}

export function isIsUpdatingNodeDefinition(
  isUpdating: NodeDefinition,
): isUpdating is IsUpdatingNodeDefinition {
  return isUpdating.type === IsUpdatingNodeType;
}

const untilSupportsIsUpdatingOperationOrStaticNode = {
  predicate: (node: GraphNode) =>
    supportsIsUpdatingOperation(node) || !supportsEvaluateOperation(node),
  errorMessage(node: GraphNode): string {
    return getInvalidTypeErrorMessage(`Target node does not support 'isUpdating' operation.`, {
      received: node.definition,
    });
  },
};
