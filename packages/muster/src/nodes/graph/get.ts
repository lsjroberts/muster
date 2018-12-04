import { getChildOperation, supportsGetChildOperation } from '../../operations/get-child';
import { supportsGetItemsOperation } from '../../operations/get-items';
import {
  ChildKey,
  Context,
  ContextValues,
  GraphAction,
  GraphNode,
  NodeDefinition,
  NodeDependency,
  NodeLike,
  StatelessGraphNode,
  StatelessNodeDefinition,
  StatelessNodeType,
} from '../../types/graph';
import { createContext } from '../../utils/create-context';
import createGraphAction from '../../utils/create-graph-action';
import createGraphNode from '../../utils/create-graph-node';
import createNodeDefinition from '../../utils/create-node-definition';
import { createNodeType } from '../../utils/create-node-type';
import { getInvalidTypeErrorMessage } from '../../utils/get-invalid-type-error';
import * as graphTypes from '../../utils/graph-types';
import pascalCase from '../../utils/pascal-case';
import { toNode } from '../../utils/to-node';
import withScopeFrom from '../../utils/with-scope-from';
import { applyTransforms } from '../collection/apply-transforms';
import { head } from '../collection/head';
import { FirstNodeType } from '../collection/keys/first';
import { LastNodeType } from '../collection/keys/last';
import { length, LengthNodeType } from '../collection/keys/length';
import { NthNodeType } from '../collection/keys/nth';
import { supportsLengthOperation } from '../collection/operations/length';
import { count } from '../collection/transforms/count';
import { firstItem } from '../collection/transforms/first-item';
import { lastItem } from '../collection/transforms/last-item';
import { nthItem } from '../collection/transforms/nth-item';
import { isListKeyNode, ListKeyNode } from '../collection/utils/is-list-key-node';
import { error } from './error';
import { ParamNode } from './param';
import { toValue, value, ValueNode, ValueNodeDefinition, ValueNodeType } from './value';

/**
 * An instance of the [[get]] node.
 * See the [[get]] documentation to find out more.
 */
export interface GetNode extends StatelessGraphNode<'get', GetNodeProperties> {}

/**
 * A definition of the [[get]] node.
 * See the [[get]] documentation to find out more.
 */
export interface GetNodeDefinition extends StatelessNodeDefinition<'get', GetNodeProperties> {}

export interface GetNodeProperties {
  subject: NodeDefinition;
  key: NodeDefinition;
}

/**
 * The implementation of the [[get]].
 * See the [[get]] documentation page for more information.
 */
export const GetNodeType: StatelessNodeType<'get', GetNodeProperties> = createNodeType<
  'get',
  GetNodeProperties
>('get', {
  shape: {
    subject: graphTypes.nodeDefinition,
    key: graphTypes.nodeDefinition,
  },
  operations: {
    evaluate: {
      getDependencies({ subject, key }: GetNodeProperties): Array<NodeDependency> {
        return [
          {
            target: subject,
            until: untilNodeSupportedByGet,
          },
          {
            target: key,
            until: untilIsValueNodeOrKeyNode,
          },
        ];
      },
      run(
        node: GetNode,
        operation: never,
        [subjectNode, keyNode]: [GraphNode, ValueNode<any> | ListKeyNode],
      ): NodeDefinition | GraphNode | GraphAction {
        if (isListKeyNode(keyNode)) {
          if (FirstNodeType.is(keyNode)) {
            return withScopeFrom(
              subjectNode,
              head(applyTransforms(subjectNode.definition, [firstItem()])),
            );
          }
          if (LastNodeType.is(keyNode)) {
            return withScopeFrom(
              subjectNode,
              head(applyTransforms(subjectNode.definition, [lastItem()])),
            );
          }
          if (NthNodeType.is(keyNode)) {
            const { index } = keyNode.definition.properties;
            return withScopeFrom(
              subjectNode,
              head(applyTransforms(subjectNode.definition, [nthItem(index)])),
            );
          }
          if (LengthNodeType.is(keyNode)) {
            if (supportsLengthOperation(subjectNode)) {
              return withScopeFrom(subjectNode, length(subjectNode.definition));
            }
            return withScopeFrom(
              subjectNode,
              head(applyTransforms(subjectNode.definition, [count()])),
            );
          }
        }
        if (!supportsGetChildOperation(subjectNode)) {
          return withScopeFrom(
            subjectNode,
            error(untilNodeSupportedByGet.errorMessage(subjectNode)),
          );
        }
        return createGraphAction(
          subjectNode,
          getChildOperation(keyNode.definition.properties.value),
        );
      },
    },
  },
});

const untilNodeSupportedByGet = {
  predicate: (node: GraphNode): boolean =>
    supportsGetChildOperation(node) ||
    supportsGetItemsOperation(node) ||
    supportsLengthOperation(node),
  errorMessage(node: GraphNode): string {
    return getInvalidTypeErrorMessage(
      `${pascalCase(node.definition.type.name)} node does not allow child access`,
      { received: node.definition },
    );
  },
};

const untilIsValueNodeOrKeyNode = {
  predicate: (input: GraphNode): input is ValueNode<any> | ListKeyNode =>
    ValueNodeType.is(input) || isListKeyNode(input),
  errorMessage(node: GraphNode): string {
    return getInvalidTypeErrorMessage(`Invalid ${GetNodeType.name} node key value`, {
      expected: [ValueNodeType, FirstNodeType, LastNodeType, NthNodeType, LengthNodeType],
      received: node.definition,
    });
  },
};

export type PathKey = string | GraphNode | ListKeyNode;

/**
 * Creates a new instance of the [[get]] node, which is a node used for traversing a graph.
 * It can be used for getting `child` node from a given "container-like" node. It's used internally by [ref](_nodes_graph_ref_.html#ref).
 *
 * Muster has a number of nodes which can be considered "container-like" nodes:
 * [[tree]], [[placeholder]], [[extend]], etc.
 *
 *
 * @example **Getting a child from a branch**
 * ```js
 * import muster, { get, tree, value } from '@dws/muster';
 *
 * const app = muster({
 *   name: 'from muster graph',
 * });
 *
 * const name = await app.resolve(get(
 *   tree({ name: value('from test branch') }),
 *   value('name'),
 * ));
 * // name === 'from test branch'
 * ```
 * [[get]]s operate in the context of a given root node. In this example we've chosen a new
 * [[tree]] to be our root node.
 *
 * If you want to access the name from the root of the muster graph, you can use a special
 * type of [[NodeDefinition]]: [[root]]. See the "**Using root node**" example for more information.
 *
 *
 * @example **Using the root node**
 * ```js
 * import muster, { get, root, value } from '@dws/muster';
 *
 * const app = muster({
 *   name: 'from muster graph',
 * });
 *
 * const name = await app.resolve(get(root(), value('name')));
 * // name === 'from muster graph'
 * ```
 *
 *
 * @example **Nesting get nodes**
 * ```js
 * import muster, { get, root, value } from '@dws/muster';
 *
 * const app = muster({
 *   user: {
 *     firstName: 'Bob',
 *   },
 * });
 *
 * const firstName = await app.resolve(
 *   get(
 *     get(root(), value('user')),
 *     value('firstName'),
 *   ),
 * );
 * // firstName === 'Bob'
 * // These nested get nodes are equivalent to: ref('user', 'firstName')
 * ```
 * Because the root of the [[get]] can be any [[NodeDefinition]], one can
 * make nested [[get]]s - the result of the inner get is used as the root of the outer.
 *
 * As this syntax is a bit clunky, Muster includes a [ref](_nodes_graph_ref_.html#ref) to help..
 */
export function get(subject: NodeLike, path: Array<NodeLike> | NodeLike): GetNodeDefinition {
  if (Array.isArray(path)) {
    return composeNestedGet(subject, normalizePath(path));
  }
  return createNodeDefinition(GetNodeType, {
    subject: toNode(subject),
    key: toValue(path),
  });
}

function composeNestedGet(root: NodeLike, path: Array<NodeDefinition>): GetNodeDefinition {
  if (path.length === 1) {
    return createNodeDefinition(GetNodeType, {
      subject: toNode(root),
      key: toValue(path[0]),
    });
  }
  const endIndex = path.length - 1;
  const currentPath = path[endIndex];
  const remainingParts = path.slice(0, endIndex);
  return get(composeNestedGet(root, remainingParts), currentPath);
}

function normalizePath(input: NodeLike | Array<NodeLike>): Array<NodeDefinition> {
  return Array.isArray(input) ? input.map(toValue) : [toValue(input)];
}

export function isGetNodeDefinition(value: NodeDefinition): value is GetNodeDefinition {
  return value.type === GetNodeType;
}

export const PARENT = Symbol('PARENT');
export const PARENT_SCOPE_PATH_KEY = Symbol('PARENT_SCOPE_PATH_KEY');

const PATH_KEY = Symbol('PATH_KEY');

export function getPath(context: Context): Array<ChildKey> {
  if (!contextHasPathKey(context)) {
    // TODO: Remove the `as any` cast once https://github.com/Microsoft/TypeScript/issues/1863 is resolved
    if (context.values[PARENT_SCOPE_PATH_KEY as any]) {
      // TODO: Remove the `as any` cast once https://github.com/Microsoft/TypeScript/issues/1863 is resolved
      return (context.values[PARENT_SCOPE_PATH_KEY as any].definition as ValueNodeDefinition<
        Array<ChildKey>
      >).properties.value;
    }
    return [];
  }
  const currentPathKey = getContextPathKey(context);
  const parentPathContext = getParentPathContext(context);
  return parentPathContext ? [...getPath(parentPathContext), currentPathKey] : [currentPathKey];
}

type ContextWithPathKey = Context & {
  values: Context['values'] & {
    [PATH_KEY: string]: ValueNode<ChildKey> | ParamNode;
  };
};

function contextHasPathKey(context: Context): context is ContextWithPathKey {
  // TODO: Remove the `as any` cast once https://github.com/Microsoft/TypeScript/issues/1863 is resolved
  return !!context.values[PATH_KEY as any];
}

function getContextPathKey(context: ContextWithPathKey): ChildKey {
  // TODO: Remove the `as any` cast once https://github.com/Microsoft/TypeScript/issues/1863 is resolved
  return (context.values[PATH_KEY as any] as ValueNode<ChildKey>).definition.properties.value;
}

export function getParentPathContext(context: Context): Context | undefined {
  // TODO: Remove the `as any` cast once https://github.com/Microsoft/TypeScript/issues/1863 is resolved
  if (!context.values[PATH_KEY as any] || context.parent === undefined) {
    // TODO: Remove the `as any` cast once https://github.com/Microsoft/TypeScript/issues/1863 is resolved
    return context.values[PARENT_SCOPE_PATH_KEY as any] ? context : undefined;
  }
  // TODO: Remove the `as any` cast once https://github.com/Microsoft/TypeScript/issues/1863 is resolved
  if (context.parent.values[PATH_KEY as any] !== context.values[PATH_KEY as any]) {
    return context.parent;
  }
  return getParentPathContext(context.parent);
}

export function createChildPathContext(
  parentNode: GraphNode,
  key: ChildKey,
  values?: ContextValues,
): Context {
  const keyNode = createGraphNode(parentNode.scope, parentNode.context.root, value(key));
  return createContext(parentNode.context, {
    [PATH_KEY]: keyNode,
    [PARENT]: parentNode,
    ...values,
  });
}
