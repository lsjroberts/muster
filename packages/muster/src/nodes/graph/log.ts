import {
  GraphNode,
  NodeDefinition,
  NodeDependency,
  NodeLike,
  StatelessGraphNode,
  StatelessNodeDefinition,
  StatelessNodeType,
} from '../../types/graph';
import createNodeDefinition from '../../utils/create-node-definition';
import { createNodeType } from '../../utils/create-node-type';
import getType from '../../utils/get-type';
import * as graphTypes from '../../utils/graph-types';

/**
 * An instance of the [[log]] node.
 * See the [[log]] documentation to find out more.
 */
export interface LogNode extends StatelessGraphNode<'log', LogNodeProperties> {}

/**
 * A definition of the [[log]] node.
 * See the [[log]] documentation to find out more.
 */
export interface LogNodeDefinition extends StatelessNodeDefinition<'log', LogNodeProperties> {}

export interface LogNodeProperties {
  target: NodeDefinition;
}

/**
 * The implementation of the [[log]].
 * See the [[log]] documentation to learn more.
 */
export const LogNodeType: StatelessNodeType<'log', LogNodeProperties> = createNodeType<
  'log',
  LogNodeProperties
>('log', {
  shape: {
    target: graphTypes.nodeDefinition,
  },
  operations: {
    evaluate: {
      getDependencies({ target }: LogNodeProperties): [NodeDependency] {
        return [
          {
            target,
            allowPending: true,
            allowErrors: true,
            acceptNil: true,
          },
        ];
      },
      run(node: LogNode, options: never, [targetValue]: [GraphNode]): NodeDefinition {
        const { target } = node.definition.properties;
        const input = target;
        const output = targetValue.definition;
        window.console.log({ input: getType(input), output: getType(output) });
        return target;
      },
    },
  },
});

/**
 * Creates a new instance of a [[log]] node, which is a type of a [[NodeDefinition]] used for logging a value of a
 * target node every time it emits a new value.
 *
 * @example **Log [[computed]] value**
 * ```js
 * import muster, { computed, log, ref, set, variable } from '@dws/muster';
 *
 * const app = muster({
 *   balance: variable(500),
 *   bet: variable(100),
 *   canBet: log(
 *     computed(
 *       [ref('balance'), ref('bet')],
 *       (balance, bet) => balance >= bet,
 *     ),
 *   ),
 * });
 *
 * // Just subscribe, no need to log anything as LogNode will handle that
 * app.resolve(ref('canBet')).subscribe((canBet) => {});
 *
 * await app.resolve(set('bet', 510));
 *
 * await app.resolve(set('bet', 30));
 *
 * // Console output:
 * // { input: <<computed node>>, output: value(true) }
 * // { input: <<computed node>>, output: value(false) }
 * // { input: <<computed node>>, output: value(true) }
 * ```
 */
export function log(target: NodeLike | NodeDefinition): LogNodeDefinition {
  return createNodeDefinition(LogNodeType, {
    target,
  });
}

export function isLogNodeDefinition(value: NodeDefinition): value is LogNodeDefinition {
  return value.type === LogNodeType;
}
