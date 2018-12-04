import { setOperation, SettableGraphNode } from '../../operations/set';
import {
  GraphAction,
  GraphNode,
  isNodeDefinition,
  NodeDefinition,
  NodeDependency,
  NodeLike,
  StatelessGraphNode,
  StatelessNodeDefinition,
  StatelessNodeType,
} from '../../types/graph';
import createGraphAction from '../../utils/create-graph-action';
import createNodeDefinition from '../../utils/create-node-definition';
import { createNodeType } from '../../utils/create-node-type';
import * as graphTypes from '../../utils/graph-types';
import { isRootAndPath, ref, RootAndPath } from '../../utils/ref';
import { get } from './get';
import { root } from './root';
import { untilSupportsSetOperation } from './set';
import { toValue } from './value';

/**
 * An instance of the [[setResult]] node.
 * See the [[setResult]] documentation to find out more.
 */
export interface SetResultNode extends StatelessGraphNode<'setResult', SetResultNodeProperties> {}

/**
 * A definition of the [[setResult]] node.
 * See the [[setResult]] documentation to find out more.
 */
export interface SetResultNodeDefinition
  extends StatelessNodeDefinition<'setResult', SetResultNodeProperties> {}

export interface SetResultNodeProperties {
  target: NodeDefinition;
  value: NodeDefinition;
}

/**
 * The implementation of the [[setResult]] node.
 * See the [[setResult]] documentation to learn more.
 */
export const SetResultNodeType: StatelessNodeType<
  'setResult',
  SetResultNodeProperties
> = createNodeType<'setResult', SetResultNodeProperties>('setResult', {
  shape: {
    target: graphTypes.nodeDefinition,
    value: graphTypes.nodeDefinition,
  },
  operations: {
    evaluate: {
      cacheable: false,
      getDependencies({ target, value }: SetResultNodeProperties): Array<NodeDependency> {
        return [
          {
            target,
            until: untilSupportsSetOperation,
          },
          {
            target: value,
          },
        ];
      },
      run(
        node: SetResultNode,
        operation: never,
        [targetNode, value]: [SettableGraphNode, GraphNode],
      ): GraphAction {
        return createGraphAction(targetNode, setOperation(value.definition));
      },
    },
  },
});

/**
 * Creates instance of the [[setResult]] node, which allows for setting values of certain nodes, e.g. [[variable]],
 * [[fromPromise]] and [[placeholder]]. Compared to the [[set]] node, the [[setResult]] node first
 * resolves the value to a static node before setting the settable node.
 *
 * The output of a [[setResult]] is the same as a [[value]] property. See the "**Setting
 * a variable**" example for more information.
 *
 * When resolving a [[setResult]] against an asynchronous node like [[fromPromise]], the value from
 * the resolver will wait for [[fromPromise]] to update to new value, then emit value from
 * [[setResult]]. See the "**Setting asynchronous nodes**" example for more information.
 *
 *
 * @example **Setting a variable**
 * ```js
 * import muster, { setResult, variable } from '@dws/muster';
 *
 * const app = muster({
 *   name: variable('Bob'),
 * });
 *
 * console.log('Setting variable');
 * app.resolve(setResult('name', 'Jane')).subscribe((result) => {
 *   // result === 'Jane'
 *   console.log('SetResult resolved');
 * });
 * console.log('End');
 *
 * // Console output:
 * // Setting variable
 * // SetResult resolved
 * // End
 * ```
 * This example demonstrates how a [[setResult]] can be used to update the value of a [[variable]].
 * The [[setResult]] also returns the value setResult to the target node.
 * See the [[variable]] documentation to learn more about the lifecycle of variables in
 * Muster.
 *
 *
 * @example **Setting asynchronous nodes**
 * ```ts
 * import muster, { fromPromise, setResult } from '@dws/muster';
 *
 * let savedName = 'Bob';
 *
 * const app = muster({
 *   name: fromPromise({
 *     get: () => Promise.resolve(savedName),
 *     set: (props, newValue) => new Promise((resolve) => {
 *       // newValue is a ValueNode
 *       savedName = newValue;
 *       resolve();
 *     }),
 *   }),
 * });
 *
 * console.log('Setting variable');
 * app.resolve(setResult('name', 'Jane')).subscribe((result) => {
 *   // result === 'Jane'
 *   console.log('SetResult resolved');
 * });
 * console.log('End');
 *
 * // Console output:
 * // Setting variable
 * // End
 * // SetResult resolved
 * ```
 * This example demonstrates that a [[setResult]] waits for the target value to be updated before
 * returning a result.
 * See the [[fromPromise]] for more information on how to make asynchronous API requests.
 *
 * The fact that the [[setResult]] waits for the operation to finish is very useful when using it as
 * part of a [[series]], [[fn]] or [[action]].
 *
 *
 * @example **Computing value before saving**
 * ```javascript
 * import muster, { format, ref, setResult, variable } from '@dws/muster';
 *
 * const app = muster({
 *   url: variable('/'),
 * });
 *
 * console.log('Getting URL');
 * app.resolve(ref('url')).subscribe((result) => {
 *   console.log('URL:', result);
 * });
 *
 * console.log('Setting URL');
 * await app.resolve(setResult('url', format('/article/${id}', {
 *   id: 'test-id',
 * })));
 *
 * // Console output:
 * // Getting URL
 * // URL: /
 * // Setting URL
 * // URL: /article/test-id
 * ```
 * This example shows how to use the [[setResult]] node to resolve the value before setting the node.
 */
export function setResult(rootAndPath: RootAndPath, value: NodeLike): SetResultNodeDefinition;
export function setResult(target: NodeDefinition, value: NodeLike): SetResultNodeDefinition;
export function setResult(
  root: NodeDefinition,
  path: NodeLike | Array<NodeLike>,
  value: NodeLike,
): SetResultNodeDefinition;
export function setResult(
  path: NodeLike | Array<NodeLike>,
  value: NodeLike,
): SetResultNodeDefinition;
export function setResult(
  ...args: Array<RootAndPath | NodeLike | Array<NodeLike> | NodeDefinition>
): SetResultNodeDefinition {
  // function setResult(rootAndPath: RootAndPath, value: NodeLike): SetResultNodeDefinition
  if (isRootAndPath(args[0])) {
    const [rootAndPath, value] = args as [RootAndPath, NodeLike];
    return createNodeDefinition(SetResultNodeType, {
      target: ref(rootAndPath),
      value: toValue(value),
    });
  }
  // function setResult(root: NodeDefinition, path: NodeLike | Array<NodeLike>, value: NodeLike): SetResultNodeDefinition
  if (args.length === 3) {
    const [rootNode, path, value] = args as [NodeDefinition, NodeLike | Array<NodeLike>, NodeLike];
    return createNodeDefinition(SetResultNodeType, {
      target: get(rootNode, path) as NodeDefinition,
      value: toValue(value),
    });
  }
  // function setResult(target: NodeDefinition, value: NodeLike): SetResultNodeDefinition
  if (isNodeDefinition(args[0])) {
    const [target, value] = args as [NodeDefinition, NodeLike];
    return createNodeDefinition(SetResultNodeType, {
      target,
      value: toValue(value),
    });
  }
  // function setResult(path: NodeLike | Array<NodeLike>, value: NodeLike): SetResultNodeDefinition
  const [path, value] = args as [NodeLike | Array<NodeLike>, NodeLike];
  return createNodeDefinition(SetResultNodeType, {
    target: get(root(), path) as NodeDefinition,
    value: toValue(value),
  });
}

export function isSetResultNodeDefinition(value: NodeDefinition): value is SetResultNodeDefinition {
  return value.type === SetResultNodeType;
}
