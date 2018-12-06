import {
  GraphNode,
  NodeDefinition,
  NodeDependency,
  StatelessGraphNode,
  StatelessNodeDefinition,
  StatelessNodeType,
} from '../../types/graph';
import createNodeDefinition from '../../utils/create-node-definition';
import { createNodeType } from '../../utils/create-node-type';
import * as graphTypes from '../../utils/graph-types';
import { NilNodeType } from './nil';
import { value } from './value';

/**
 * An instance of the [[isNil]] node.
 * See the [[isNil]] documentation to find out more.
 */
export interface IsNilNode extends StatelessGraphNode<'is-nil', IsNilNodeProperties> {}

/**
 * A definition of the [[isNil]] node.
 * See the [[isNil]] documentation to find out more.
 */
export interface IsNilNodeDefinition
  extends StatelessNodeDefinition<'is-nil', IsNilNodeProperties> {}

export interface IsNilNodeProperties {
  target: NodeDefinition;
}

/**
 * The implementation of the [[isNil]].
 * See the [[isNil]] documentation to learn more.
 */
export const IsNilNodeType: StatelessNodeType<'is-nil', IsNilNodeProperties> = createNodeType<
  'is-nil',
  IsNilNodeProperties
>('is-nil', {
  serialize: false,
  deserialize: false,
  shape: {
    target: graphTypes.nodeDefinition,
  },
  operations: {
    evaluate: {
      getDependencies({ target }: IsNilNodeProperties): [NodeDependency] {
        return [
          {
            target,
            acceptNil: true,
          },
        ];
      },
      run(node: IsNilNode, options: never, [targetValue]: [GraphNode]): NodeDefinition {
        return value(NilNodeType.is(targetValue));
      },
    },
  },
});

/**
 * Creates an instance of an [[isNil]] node, which is a node used when checking if a given target is [[nil]].
 *
 * @example **Check if target node is nil**
 * ```js
 * import muster, { isNil, nil, ref, value } from '@dws/muster';
 *
 * const app = muster({
 *   currentValue: value('some current value'),
 *   previousValue: nil(),
 * });
 *
 * await app.resolve(isNil(ref('currentValue'))); // === false
 *
 * await app.resolve(isNil(ref('previousValue'))); // === true
 * ```
 * This example shows how to check if a given node is [[nil]](or resolves to a [[nil]]).
 */
export function isNil(target: NodeDefinition): IsNilNodeDefinition {
  return createNodeDefinition(IsNilNodeType, {
    target,
  });
}

export function isIsNilNodeDefinition(value: NodeDefinition): value is IsNilNodeDefinition {
  return value.type === IsNilNodeType;
}
