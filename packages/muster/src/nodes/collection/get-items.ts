import { getItemsOperation } from '../../operations/get-items';
import { GraphNode, NodeDefinition } from '../../types/graph';
import { deprecated } from '../../utils/deprecated';
import { traverse } from '../graph/traverse';
import { applyTransforms } from './apply-transforms';

const showGetItemsDeprecationWarning = deprecated({
  old: 'getItems',
  new: 'applyTransforms',
});

/**
 * Creates a new instance of a node used to apply transforms to the target collection.
 *
 * @param target
 * @param transforms
 * @deprecated
 */
export function getItems(
  target: NodeDefinition,
  transforms?: Array<NodeDefinition | GraphNode>,
): NodeDefinition {
  showGetItemsDeprecationWarning();
  const transformedTarget = applyTransforms(target, transforms || []);
  return traverse(transformedTarget, getItemsOperation());
}
