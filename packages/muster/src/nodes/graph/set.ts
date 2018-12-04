import { setOperation, SettableGraphNode, supportsSetOperation } from '../../operations/set';
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
import { getInvalidTypeErrorMessage } from '../../utils/get-invalid-type-error';
import * as graphTypes from '../../utils/graph-types';
import { isRootAndPath, ref, RootAndPath } from '../../utils/ref';
import { get } from './get';
import { root } from './root';
import { toValue } from './value';

/**
 * An instance of the [[set]] node.
 * See the [[set]] documentation to find out more.
 */
export interface SetNode extends StatelessGraphNode<'set', SetNodeProperties> {}

/**
 * A definition of the [[set]] node.
 * See the [[set]] documentation to find out more.
 */
export interface SetNodeDefinition extends StatelessNodeDefinition<'set', SetNodeProperties> {}

export interface SetNodeProperties {
  target: NodeDefinition;
  value: NodeDefinition;
}

/**
 * The implementation of the [[set]] node.
 * See the [[set]] documentation to learn more.
 */
export const SetNodeType: StatelessNodeType<'set', SetNodeProperties> = createNodeType<
  'set',
  SetNodeProperties
>('set', {
  shape: {
    target: graphTypes.nodeDefinition,
    value: graphTypes.nodeDefinition,
  },
  operations: {
    evaluate: {
      cacheable: false,
      getDependencies({ target }: SetNodeProperties): [NodeDependency] {
        return [
          {
            target,
            until: untilSupportsSetOperation,
          },
        ];
      },
      run(node: SetNode, operation: never, [targetNode]: [SettableGraphNode]): GraphAction {
        const { value } = node.definition.properties;
        return createGraphAction(targetNode, setOperation(value));
      },
    },
  },
});

/**
 * Creates instance of the [[set]] node, which allows for setting values of certain nodes, e.g. [[variable]],
 * [[fromPromise]] and [[placeholder]].
 *
 * The output of a [[set]] is the same as a [[value]] property. See the "**Setting
 * a variable**" example for more information.
 *
 * When resolving a [[set]] against an asynchronous node like [[fromPromise]], the value from
 * the resolver will wait for [[fromPromise]] to update to new value, then emit value from
 * [[set]]. See the "**Setting asynchronous nodes**" example for more information.
 *
 * This node does not resolve the value before setting the value of the settable node. To resolve the
 * value before setting the value of the settable node use the [[setResult]] node.
 *
 *
 * @example **Setting a variable**
 * ```js
 * import muster, { set, variable } from '@dws/muster';
 *
 * const app = muster({
 *   name: variable('Bob'),
 * });
 *
 * console.log('Setting variable');
 * app.resolve(set('name', 'Jane')).subscribe((result) => {
 *   // result === 'Jane'
 *   console.log('Set resolved');
 * });
 * console.log('End');
 *
 * // Console output:
 * // Setting variable
 * // Set resolved
 * // End
 * ```
 * This example demonstrates how a [[set]] can be used to update the value of a [[variable]].
 * The [[set]] also returns the value set to the target node.
 * See the [[variable]] documentation to learn more about the lifecycle of variables in
 * Muster.
 *
 *
 * @example **Setting asynchronous nodes**
 * ```ts
 * import muster, { fromPromise, set } from '@dws/muster';
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
 * app.resolve(set('name', 'Jane')).subscribe((result) => {
 *   // result === 'Jane'
 *   console.log('Set resolved');
 * });
 * console.log('End');
 *
 * // Console output:
 * // Setting variable
 * // End
 * // Set resolved
 * ```
 * This example demonstrates that a [[set]] waits for the target value to be updated before
 * returning a result.
 * See the [[fromPromise]] for more information on how to make asynchronous API requests.
 *
 * The fact that the [[set]] waits for the operation to finish is very useful when using it as
 * part of a [[series]], [[fn]] or [[action]].
 */
export function set(rootAndPath: RootAndPath, value: NodeLike): SetNodeDefinition;
export function set(target: NodeDefinition, value: NodeLike): SetNodeDefinition;
export function set(
  root: NodeDefinition,
  path: NodeLike | Array<NodeLike>,
  value: NodeLike,
): SetNodeDefinition;
export function set(path: NodeLike | Array<NodeLike>, value: NodeLike): SetNodeDefinition;
export function set(
  ...args: Array<RootAndPath | NodeLike | Array<NodeLike> | NodeDefinition>
): SetNodeDefinition {
  // function set(rootAndPath: RootAndPath, value: NodeLike): SetNodeDefinition
  if (isRootAndPath(args[0])) {
    const [rootAndPath, value] = args as [RootAndPath, NodeLike];
    return createNodeDefinition(SetNodeType, {
      target: ref(rootAndPath),
      value: toValue(value),
    });
  }
  // function set(root: NodeDefinition, path: NodeLike | Array<NodeLike>, value: NodeLike): SetNodeDefinition
  if (args.length === 3) {
    const [rootNode, path, value] = args as [NodeDefinition, NodeLike | Array<NodeLike>, NodeLike];
    return createNodeDefinition(SetNodeType, {
      target: get(rootNode, path) as NodeDefinition,
      value: toValue(value),
    });
  }
  // function set(target: NodeDefinition, value: NodeLike): SetNodeDefinition
  if (isNodeDefinition(args[0])) {
    const [target, value] = args as [NodeDefinition, NodeLike];
    return createNodeDefinition(SetNodeType, {
      target,
      value: toValue(value),
    });
  }
  // function set(path: NodeLike | Array<NodeLike>, value: NodeLike): SetNodeDefinition
  const [path, value] = args as [NodeLike | Array<NodeLike>, NodeLike];
  return createNodeDefinition(SetNodeType, {
    target: get(root(), path) as NodeDefinition,
    value: toValue(value),
  });
}

export function isSetNodeDefinition(value: NodeDefinition): value is SetNodeDefinition {
  return value.type === SetNodeType;
}

export const untilSupportsSetOperation = {
  predicate: supportsSetOperation,
  errorMessage(node: GraphNode): string {
    return getInvalidTypeErrorMessage(`Target node is not settable`, {
      received: node.definition,
    });
  },
};
