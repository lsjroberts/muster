import {
  NodeDefinition,
  StaticGraphNode,
  StaticNodeDefinition,
  StaticNodeType,
} from '../../types/graph';
import createNodeDefinition from '../../utils/create-node-definition';
import { createNodeType } from '../../utils/create-node-type';
import * as graphTypes from '../../utils/graph-types';

/**
 * An instance of the [[quote]] node.
 * See the [[quote]] documentation to find out more.
 */
export interface QuoteNode extends StaticGraphNode<'quote', QuoteNodeProperties> {}

/**
 * A definition of the [[quote]] node.
 * See the [[quote]] documentation to find out more.
 */
export interface QuoteNodeDefinition extends StaticNodeDefinition<'quote', QuoteNodeProperties> {}

export interface QuoteNodeProperties {
  node: NodeDefinition;
}

/**
 * The implementation of the [[quote]] node.
 * See the [[quote]] documentation to learn more.
 */
export const QuoteNodeType: StaticNodeType<'quote', QuoteNodeProperties> = createNodeType<
  'quote',
  QuoteNodeProperties
>('quote', {
  shape: {
    node: graphTypes.nodeDefinition,
  },
});

/**
 * Creates a new instance of the [[quote]] node, which is a node used as a wrapper for different nodes.
 * It is useful when there's a need to prevent a node from being unintentionally resolved/evaluated by muster.
 *
 * @example **Creating a quote node**
 * ```js
 * import muster, { computed, quote } from '@dws/muster';
 *
 * const app = muster({});
 *
 * // Without quote node
 * await app.resolve(computed(
 *   [computed([], () => 'Some value')],
 *   (node) => {
 *     // node === 'Some value'
 *     // perform some logic
 *   },
 * ));
 *
 * // With quote node
 * await app.resolve(computed(
 *   [quote(computed([], () => 'Some value'))],
 *   (node) => {
 *     // node === quote(computed([], () => 'Some value'))
 *     // perform some logic
 *   },
 * ));
 * ```.
 */
export function quote(node: NodeDefinition): QuoteNodeDefinition {
  return createNodeDefinition(QuoteNodeType, { node });
}

export function isQuoteNodeDefinition(quote: NodeDefinition): quote is QuoteNodeDefinition {
  return quote.type === QuoteNodeType;
}
