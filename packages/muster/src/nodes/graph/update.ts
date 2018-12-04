import { NodeLike } from '../../types';
import {
  GraphNode,
  isNodeDefinition,
  NodeDefinition,
  NodeDependency,
  StatelessGraphNode,
  StatelessNodeDefinition,
  StatelessNodeType,
} from '../../types/graph';
import createNodeDefinition from '../../utils/create-node-definition';
import { createNodeType } from '../../utils/create-node-type';
import * as graphTypes from '../../utils/graph-types';
import { isRootAndPath, ref, RootAndPath } from '../../utils/ref';
import { toNode } from '../../utils/to-node';
import { call } from './call';
import { get } from './get';
import { root } from './root';
import { set } from './set';

/**
 * An instance of the [[update]] node.
 * See the [[update]] documentation to find out more.
 */
export interface UpdateNode extends StatelessGraphNode<'update', UpdateNodeProperties> {}

/**
 * A definition of the [[update]] node.
 * See the [[update]] documentation to find out more.
 */
export interface UpdateNodeDefinition
  extends StatelessNodeDefinition<'update', UpdateNodeProperties> {}

export interface UpdateNodeProperties {
  target: NodeDefinition;
  updater: NodeDefinition;
}

/**
 * The implementation of the [[update]] node.
 * See the [[update]] documentation to learn more.
 */
export const UpdateNodeType: StatelessNodeType<'update', UpdateNodeProperties> = createNodeType<
  'update',
  UpdateNodeProperties
>('update', {
  shape: {
    target: graphTypes.nodeDefinition,
    updater: graphTypes.nodeDefinition,
  },
  operations: {
    evaluate: {
      cacheable: false,
      getDependencies({ target, updater }: UpdateNodeProperties): [NodeDependency] {
        return [
          {
            target: call(updater, [target]),
          },
        ];
      },
      run(node: UpdateNode, operation: never, [newValueNode]: [GraphNode]): NodeDefinition {
        return set(node.definition.properties.target, newValueNode.definition);
      },
    },
  },
});

export function update(rootAndPath: RootAndPath, updater: NodeLike): UpdateNodeDefinition;
export function update(path: NodeLike | Array<NodeLike>, updater: NodeLike): UpdateNodeDefinition;
export function update(target: NodeDefinition, updater: NodeLike): UpdateNodeDefinition;
export function update(
  root: NodeDefinition,
  path: NodeLike | Array<NodeLike>,
  updater: NodeLike,
): UpdateNodeDefinition;

/**
 * Creates a new instance of a [[update]] node, which is used when updating a value of a settable node to a new value, which
 * is based on a previous value of that settable node. It works in a similar way to the [[set]]
 * but instead of setting a value to a pre-defined value, it can compute the value to set based
 * on the current value of the settable node. You can think of it as `setState` from `React`.
 * The `updater` function can be any [[NodeDefinition]] that implements a `call` operation, e.g.
 * [[action]] and [[fn]], and it should resolve to a [[NodeDefinition]]. That node will then be
 * set as a value of the settable node.
 *
 *
 * @example **Increment value with action**
 * ```ts
 * import muster, { action, ref, update, variable } from '@dws/muster';
 *
 * const app = muster({
 *   counter: variable(0),
 * });
 *
 * app.resolve(ref('counter')).subscribe((counter) => {
 *   console.log(counter);
 * });
 *
 * await app.resolve(
 *   update('counter', action((counter) => counter + 1)),
 * );
 * await app.resolve(
 *   update('counter', action((counter) => counter + 1)),
 * );
 *
 * // Console output:
 * // 0
 * // 1
 * // 2
 * ```
 * This example shows how to use the [[update]] with an [[action]] updater to increment
 * a counter. The same can be accomplished with an [[fn]] and [[add]]
 *
 *
 * @example **Increment value with an [[fn]]**
 * ```ts
 * import muster, { add, fn, ref, update, variable } from '@dws/muster';
 *
 * const app = muster({
 *   counter: variable(0),
 * });
 *
 * app.resolve(ref('counter')).subscribe((counter) => {
 *   console.log(counter);
 * });
 *
 * await app.resolve(
 *   update('counter', fn((counter) => add(counter, 1))),
 * );
 * await app.resolve(
 *   update('counter', fn((counter) => add(counter, 1))),
 * );
 *
 * // Console output:
 * // 0
 * // 1
 * // 2
 * ```
 *
 *
 * @example **Change a single property of an object**
 * ```ts
 * import muster, { action, ref, update, variable } from '@dws/muster';
 *
 * const app = muster({
 *   user: variable({
 *     name: 'Bob',
 *     age: 51,
 *   }),
 * });
 *
 * app.resolve(ref('user')).subscribe((user) => {
 *   console.log(user);
 * });
 *
 * await app.resolve(
 *   update('user', action((user) => ({ ...user, age: 25 }))),
 * );
 *
 * // Console output:
 * // { name: 'Bob', age: 51 }
 * // { name: 'Bob', age: 25 }
 * ```
 * This example shows how to use the [[update]] to change a single property in an object stored
 * in a [[variable]].
 */
export function update(
  ...args: Array<RootAndPath | NodeLike | Array<NodeLike> | NodeDefinition>
): UpdateNodeDefinition {
  // function update(rootAndPath: RootAndPath, updater: NodeLike): UpdateNodeDefinition
  if (!isNodeDefinition(args[0]) && isRootAndPath(args[0])) {
    const [rootAndPath, updater] = args as [RootAndPath, NodeLike];
    return createNodeDefinition(UpdateNodeType, {
      target: ref(rootAndPath),
      updater: toNode(updater),
    });
  }
  // tslint:disable-next-line:max-line-length
  // default function update(root: NodeDefinition, path: NodeLike | Array<NodeLike>, updater: NodeLike): UpdateNodeDefinition;
  if (args.length === 3) {
    const [rootNode, path, updater] = args as [
      NodeDefinition,
      NodeLike | Array<NodeLike>,
      NodeLike
    ];
    return createNodeDefinition(UpdateNodeType, {
      target: get(rootNode, path) as NodeDefinition,
      updater: toNode(updater),
    });
  }
  // function update(target: NodeDefinition, updater: NodeLike): UpdateNodeDefinition;
  if (isNodeDefinition(args[0])) {
    const [target, updater] = args as [NodeDefinition, NodeLike];
    return createNodeDefinition(UpdateNodeType, {
      target,
      updater: toNode(updater),
    });
  }
  const [path, updater] = args as [NodeLike | Array<NodeLike>, NodeLike];
  return createNodeDefinition(UpdateNodeType, {
    target: get(root(), path) as NodeDefinition,
    updater: toNode(updater),
  });
}

export function isUpdateNodeDefinition(value: NodeDefinition): value is UpdateNodeDefinition {
  return value.type === UpdateNodeType;
}
