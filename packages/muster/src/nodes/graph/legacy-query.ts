import zipObject from 'lodash/zipObject';
import { supportsEvaluateOperation } from '../../operations/evaluate';
import { supportsGetChildOperation } from '../../operations/get-child';
import { getItemsOperation, supportsGetItemsOperation } from '../../operations/get-items';
import { resolveOperation, ResolveProperties } from '../../operations/resolve';
import {
  DisposeCallback,
  GraphNode,
  isGraphNode,
  isNodeDefinition,
  NodeDefinition,
  NodeDependency,
  NodeLike,
  StatelessGraphNode,
  StatelessNodeDefinition,
  StatelessNodeType,
} from '../../types/graph';
import createNodeDefinition from '../../utils/create-node-definition';
import { createNodeType } from '../../utils/create-node-type';
import {
  getInvalidTypeError,
  getInvalidTypeErrorMessage,
} from '../../utils/get-invalid-type-error';
import * as graphTypes from '../../utils/graph-types';
import pascalCase from '../../utils/pascal-case';
import { toNode } from '../../utils/to-node';
import { treeToObject } from '../../utils/tree-to-object';
import withScopeFrom from '../../utils/with-scope-from';
import withTransaction from '../../utils/with-transaction';
import { array, ArrayNode, ArrayNodeDefinition, ArrayNodeType } from '../collection/array';
import { NodeListNode, NodeListNodeType } from '../collection/node-list';
import { call } from './call';
import { isCatchErrorNodeDefinition } from './catch-error';
import { isCreateCallerNodeDefinition } from './create-caller';
import { isCreateSetterNodeDefinition } from './create-setter';
import { isDeferNodeDefinition } from './defer';
import { EmptyItemNodeType } from './empty-item';
import {
  EntriesNode,
  EntriesNodeDefinition,
  EntriesNodeType,
  isEntriesNodeDefinition,
} from './entries';
import { error, ErrorNode, ErrorNodeType, isErrorNodeDefinition, withErrorPath } from './error';
import {
  ChildKeyDefinition,
  fields,
  FieldSetDefinition,
  FieldsNode,
  FieldsNodeType,
} from './fields';
import { get, getPath } from './get';
import { ifError } from './if-error';
import { ifPending } from './if-pending';
import { isIsPendingNodeDefinition } from './is-pending';
import { isItemPlaceholderNodeDefinition } from './item-placeholder';
import { KeyNodeDefinition } from './key';
import { NilNode, NilNodeType } from './nil';
import { pending, PendingNodeType } from './pending';
import { PlaceholderNode, PlaceholderNodeType } from './placeholder';
import { QuoteNodeType } from './quote';
import { resolve } from './resolve';
import { set } from './set';
import { traverse } from './traverse';
import { tree } from './tree';
import { toValue, value, ValueNodeType } from './value';
import {
  isWithTransformsNodeDefinition,
  WithTransformsNode,
  WithTransformsNodeDefinition,
  WithTransformsNodeType,
} from './with-transforms';

export function createEmptyDisposeEmitter() {
  return () => () => {};
}

/**
 * An instance of the [[legacyQuery]] node.
 * See the [[legacyQuery]] documentation to find out more.
 */
export interface LegacyQueryNode
  extends StatelessGraphNode<'legacyQuery', LegacyQueryNodeProperties> {}

/**
 * A definition of the [[legacyQuery]] node.
 * See the [[legacyQuery]] documentation to find out more.
 */
export interface LegacyQueryNodeDefinition
  extends StatelessNodeDefinition<'legacyQuery', LegacyQueryNodeProperties> {}

export interface LegacyQueryNodeProperties {
  keys: NodeDefinition;
  root: NodeDefinition;
}

/**
 * The implementation of the [[legacyQuery]] node.
 * See the [[legacyQuery]] documentation to learn more.
 */
export const LegacyQueryNodeType: StatelessNodeType<
  'legacyQuery',
  LegacyQueryNodeProperties
> = createNodeType<'legacyQuery', LegacyQueryNodeProperties>('legacyQuery', {
  shape: {
    keys: graphTypes.nodeDefinition,
    root: graphTypes.nodeDefinition,
  },
  operations: {
    evaluate: {
      getDependencies({ keys }: LegacyQueryNodeProperties): [NodeDependency] {
        return [
          {
            target: keys,
            until: untilIsFieldsNodeOrCollectionFieldsNode,
          },
        ];
      },
      run(
        node: LegacyQueryNode,
        operation: never,
        [keys]: [FieldsNode | EntriesNode | WithTransformsNode],
      ): NodeDefinition | GraphNode {
        const { root } = node.definition.properties;
        if (FieldsNodeType.is(keys)) {
          if (supportsGetChildOperation(root)) {
            return resolveFields(withScopeFrom(node, root), keys);
          }
          return resolve(
            [
              {
                target: root,
                until: untilSupportsGetChildOperation,
              },
            ],
            ([rootNode]) => resolveFields(rootNode, keys),
          );
        }
        if (isCollectionFieldsNode(keys)) {
          if (supportsGetItemsOperation(root)) {
            return resolveList(withScopeFrom(node, root), keys);
          }
          return resolve(
            [
              {
                target: root,
                until: untilSupportsGetItemsOperation,
              },
            ],
            ([rootNode]) => resolveList(rootNode, keys),
          );
        }
        return error(
          getInvalidTypeError('Invalid query definition.', {
            expected: [FieldsNodeType, EntriesNodeType, WithTransformsNodeType],
            received: keys,
          }),
        );
      },
    },
  },
});

const untilIsFieldsNodeOrCollectionFieldsNode: ResolveProperties['until'] = {
  predicate: isFieldsNodeOrCollectionFieldsNode,
  errorMessage(node: GraphNode): string {
    return getInvalidTypeErrorMessage('Invalid query definition.', {
      expected: [FieldsNodeType, EntriesNodeType, WithTransformsNodeType],
      received: node.definition,
    });
  },
};

function isFieldsNodeOrCollectionFieldsNode(value: GraphNode): boolean {
  return FieldsNodeType.is(value) || isCollectionFieldsNode(value);
}

function isCollectionFieldsNode(value: GraphNode): value is EntriesNode | WithTransformsNode {
  return EntriesNodeType.is(value) || WithTransformsNodeType.is(value);
}

const untilSupportsGetChildOperation: ResolveProperties['until'] = {
  predicate: supportsGetChildOperation,
  errorMessage(node: GraphNode) {
    return getInvalidTypeErrorMessage(
      `${pascalCase(node.definition.type.name)} node does not allow child access`,
      { received: node.definition },
    );
  },
};

const untilSupportsGetItemsOperation: ResolveProperties['until'] = {
  predicate: supportsGetItemsOperation,
  errorMessage(node: GraphNode) {
    return getInvalidTypeErrorMessage(
      `${pascalCase(node.definition.type.name)} node does not allow list access`,
      { received: node.definition },
    );
  },
};

/**
 * Creates an instance of a [[legacyQuery]] node, which is a node used to request values from multiple [[NodeDefinition]]s at a time.
 * This node is used internally by Muster-React when creating bindings between components and the graph.
 * See Muster-React for more information.
 *
 * By default, the [[legacyQuery]] waits for every field to resolve to a non-dynamic node.
 * This behaviour can be modified through the use of the [[isPending]] and the [[defer]].
 *
 * A [[legacyQuery]] resolves into a [[tree]], an [[array]] or a [[value]] (depending on
 * the type of the legacyQuery made). These can be easily converted into plain JS objects
 * with the [[valueOf]] helper. This conversion is reversible through the use of
 * [[toNode]] helper.
 *
 *
 * @example **Basic legacyQuery**
 * ```js
 * import muster, { key, legacyQuery, root, valueOf } from '@dws/muster';
 *
 * const app = muster({
 *   firstName: 'Rosalind',
 *   lastName: 'Franklin',
 *   dateOfBirth: 1948,
 * });
 *
 * const user = await app.resolve(legacyQuery(root(), {
 *   userFirstName: key('firstName'),
 *   lastName: key('lastName'),
 * }));
 * // user = {
 * //   userFirstName: 'Rosalind',
 * //   lastName: 'Franklin',
 * // }
 * ```
 * This example shows how to use a [[legacyQuery]] to request two [[NodeDefinition]] at the same
 * time. The `legacyQuery` call consists of: the first argument which defines the graph starting point from which
 * legacyQuery should begin the traversal; and the second argument, an object (implicitly cast to a [[fields]]) which
 * defines a map of fields to retrieve from the graph. The name of each property in that map
 * corresponds to the name in the output [[tree]]. Note that this name does not have to be the same
 * as the name in the [[key]] on the right of that property. Take the `firstName` graph node
 * and its corresponding `userFirstName` name in the legacyQuery. The ability to override the name of a
 * node is useful especially when a given [[NodeDefinition]] can be accessed in more than one way.
 * This behaviour is used extensively by the [[proxy]], and by extension the [[remote]], when
 * building a legacyQuery to a remote node.
 *
 * The [[key]] used in this legacyQuery defines the name of a given node in the graph. Additionally, the
 * [[key]] can define a map of child nodes to retrieve from that node. See the "**Getting values of
 * nested nodes**" example for more information.
 *
 * A [[legacyQuery]] resolves into a combination of [[tree]]s, [[array]]s and [[value]]s.
 * This means an output of one legacyQuery can be used as an input for another [[NodeDefinition]] and even
 * another [[legacyQuery]].
 *
 *
 * @example **Getting async values**
 * ```js
 * import muster, { fromPromise, key, legacyQuery, root } from '@dws/muster';
 *
 * let resolvePromise1;
 * const app = muster({
 *   name: 'sync name',
 *   asyncName: fromPromise(() =>
 *     new Promise((res) => resolvePromise1 = res)
 *       .then(() => 'async name'),
 *   ),
 * });
 *
 * console.log('Making the legacyQuery');
 * app.resolve(legacyQuery(root(), {
 *   name: key('name'),
 *   asyncName: key('asyncName'),
 * })).subscribe((res) => {
 *   console.log(res);
 * });
 *
 * console.log('Resolving the promise');
 * resolvePromise1();
 *
 * // Console output:
 * // Making the legacyQuery
 * // Resolving the promise
 * // {
 * //   name: 'sync name',
 * //   asyncName: 'async name',
 * // }
 * ```
 * The [[legacyQuery]] by default waits for every part of the legacyQuery to resolve to a non-pending and
 * non-dynamic value. This example demonstrates this behaviour with the help of [[fromPromise]].
 * Note that the legacyQuery output gets logged only once - after the promise is resolved. Muster can
 * also mark certain parts of the legacyQuery with [[defer]]s. This instructs Muster
 * to return the legacyQuery result even if that part of the legacyQuery is loading. See the "**Defer part of the
 * legacyQuery**" example for more information.
 *
 *
 * @example **Getting values of nested nodes**
 * ```js
 * import muster, { key, legacyQuery, root } from '@dws/muster';
 *
 * const app = muster({
 *   user: {
 *     firstName: 'Rosalind',
 *     lastName: 'Franklin',
 *   },
 * });
 *
 * const user = await app.resolve(legacyQuery(root(), {
 *   user: key('user', {
 *     firstName: key('firstName'),
 *   }),
 * }));
 * // user = {
 * //   user: {
 * //     firstName: 'Rosalind',
 * //   },
 * // }
 * ```
 * The [[legacyQuery]] can extract values from nested [[NodeDefinition]]s. As shown
 * in the previous example, the [[legacyQuery]] factory function performs an implicit conversion to a
 * [[fields]]. This saves developers from having to explicitly write unnecessarily verbose code.
 * The same functionality is available in the [[key]]. When the factory is
 * called with a pure JS object, it will recursively cast it to a [[fields]].
 *
 * Sometimes, the second argument to the [[key]] won't be a pure JS object. For
 * example, when a developer wants to get items from a collection. [[fields]] lets the
 * legacyQuery know that a target [[NodeDefinition]] is expected to be a container-like node. This assumption
 * breaks apart when requesting a collection. To request items from collections, one has to make a
 * legacyQuery with an [[entries]] instead of a [[fields]]. See the "**Getting atomic items from a
 * collection**" example to find out more.
 *
 *
 * @example **Getting atomic items from a collection**
 * ```js
 * import muster, { entries, key, legacyQuery, root } from '@dws/muster';
 *
 * const app = muster({
 *   numbers: [1, 2, 3, 4],
 * });
 *
 * const numbers = await app.resolve(legacyQuery(root(), {
 *   numbers: key('numbers', entries()),
 * }));
 * // numbers = {
 * //   numbers: [1, 2, 3, 4],
 * // }
 * ```
 * An [[entries]] can be provided instead of a [[fields]] to instruct the [[legacyQuery]] to retrieve
 * all items from a given graph node. In this example, we had it easy: every item is an atomic
 * value. The fun with [[legacyQuery]]s and collections does not end here. See the "**Getting specific
 * fields from items**" example to learn more about selecting certain fields from items.
 *
 *
 * @example **Getting specific fields from items**
 * ```js
 * import muster, { entries, key, legacyQuery, ref } from '@dws/muster';
 *
 * const app = muster({
 *   books: [
 *     { name: 'The Expeditionary Force', author: 'Craig Alanson' },
 *     { name: 'Fear The Sky', author: 'Stephen Moss' },
 *     { name: 'After It Happened', author: 'Devon Ford' },
 *   ],
 * });
 *
 * const bookNames = await app.resolve(legacyQuery(ref('books'), entries({
 *   name: key('name'),
 * })));
 * // bookNames = [
 * //   { name: 'The Expeditionary Force' },
 * //   { name: 'Fear The Sky' },
 * //   { name: 'After It Happened' },
 * // ]
 * ```
 * In this example, apart from getting just a selected field from each item in the collection, we
 * demonstrated another feature of the [[legacyQuery]]: changing its starting point.
 * In all previous examples, we've used a [[root]] as the starting point of the legacyQuery, but this time
 * to make the output shorter we've changed it to a `books` collection.
 *
 *
 * @example **Creating setters**
 * ```js
 * import muster, {
 *   createSetter,
 *   key,
 *   legacyQuery,
 *   root,
 *   variable,
 * } from '@dws/muster';
 *
 * const app = muster({
 *   name: variable('initial'),
 * });
 *
 * console.log('Making a legacyQuery for `name`');
 * app.resolve(legacyQuery(root(), { name: key('name') })).subscribe((result) => {
 *   console.log(result);
 * });
 *
 * console.log('Making a legacyQuery for setter function');
 * const result = await app.resolve(legacyQuery(root(), {
 *   setName: createSetter('name'),
 * }));
 *
 * console.log('Calling a setter');
 * result.setName('updated');
 *
 * // Console output:
 * // Making a legacyQuery for `name`
 * // initial
 * // Making a legacyQuery for setter function
 * // Calling a setter
 * // updated
 * ```
 * This example shows how a [[legacyQuery]] can be used when there's a need for imperative call
 * to a set method. This setter function can be used, for example,
 * when integrating with view frameworks such as React, Vue etc.
 * Muster-React uses this way of creating setters extensively. Similarly, there's a
 * [[createCaller]] node which allows for imperative calls to actions.
 *
 * [[createSetter]]s and [[createCaller]]s should be used only when the output of the legacyQuery
 * is used outside the "Muster world". Inside Muster code, using [[call]]s
 * [[apply]]s and [[set]]s is recommended for these kinds of actions.
 *
 *
 * @example **Defer part of a legacyQuery**
 * ```js
 * import muster, { defer, fromPromise, key, legacyQuery, root } from '@dws/muster';
 *
 * let resolvePromise2;
 * const app = muster({
 *   name: 'sync name',
 *   asyncName: fromPromise(() =>
 *     new Promise((res) => resolvePromise2 = res)
 *       .then(() => 'async name'),
 *   ),
 * });
 *
 * console.log('Requesting the legacyQuery');
 * app.resolve(legacyQuery(root(), {
 *   name: key('name'),
 *   asyncName: defer('asyncName'),
 * })).subscribe((res) => {
 *   console.log(res);
 * });
 *
 * console.log('Resolving the promise');
 * resolvePromise2();
 *
 * // Console output:
 * // Requesting the legacyQuery
 * // {
 * //   name: 'sync name',
 * //   asyncName: null,
 * // }
 * // Resolving the promise
 * // {
 * //   name: 'sync name',
 * //   asyncName: 'async name',
 * // }
 * ```
 * This example demonstrates how to instruct a [[legacyQuery]] to return the output of its legacyQuery
 * even if a given [[NodeDefinition]] is in a pending state. The legacyQuery is built with a
 * [[defer]]. This example uses a shorthand syntax for the `defer(...)` node.
 * Internally, the node converts the argument to a [[key]]:
 * ```js
 * import { defer, key } from '@dws/muster';
 *
 * defer('asyncName');
 * // is equivalent to
 * defer(key('name'));
 * ```
 * The [[defer]] also enables the defer part of the legacyQuery to return a previously loaded
 * (stale) value of the target node. See the "**Defer with previous value**" example for more
 * information.
 *
 *
 * @example **Check if defer part of the legacyQuery is loading**
 * ```js
 * import muster, {
 *   defer,
 *   fromPromise,
 *   isPending,
 *   key,
 *   legacyQuery,
 *   root,
 * } from '@dws/muster';
 *
 * let resolvePromise3;
 * const app = muster({
 *   name: 'sync name',
 *   asyncName: fromPromise(() =>
 *     new Promise((res) => resolvePromise3 = res)
 *       .then(() => 'async name'),
 *   ),
 * });
 *
 * console.log('Requesting the legacyQuery');
 * app.resolve(legacyQuery(root(), {
 *   name: key('name'),
 *   asyncName: defer('asyncName'),
 *   isLoadingAsyncName: isPending('asyncName'),
 * })).subscribe((res) => {
 *   console.log(res);
 * });
 *
 * console.log('Resolving the promise');
 * resolvePromise3();
 *
 * // Console output:
 * // Requesting the legacyQuery
 * // {
 * //   name: 'sync name',
 * //   asyncName: null,
 * //   isLoadingAsyncName: true,
 * // }
 * // Resolving the promise
 * // {
 * //   name: 'sync name',
 * //   asyncName: 'async name',
 * //   isLoadingAsyncName: false,
 * // }
 * ```
 * This example presents the use of the [[isPending]]. When used in a legacyQuery, this node checks if
 * a part of the legacyQuery is currently loading. Similarly to the [[defer]],
 * the [[isPending]] factory function implicitly converts its argument to a [[key]].
 * ```js
 * import { isPending, key } from '@dws/muster';
 *
 * isPending('asyncName');
 * // is equivalent to
 * isPending(key('asyncName'))
 * ```
 */
export function legacyQuery(
  root: NodeLike,
  keys: NodeDefinition | FieldSetDefinition,
): LegacyQueryNodeDefinition {
  return createNodeDefinition(LegacyQueryNodeType, {
    keys: isNodeDefinition(keys) ? keys : fields(keys),
    root: toNode(root),
  });
}

export function isLegacyQueryNodeDefinition(
  value: NodeDefinition,
): value is LegacyQueryNodeDefinition {
  return value.type === LegacyQueryNodeType;
}

function resolveSingleKey(parentNode: GraphNode, key: ChildKeyDefinition): NodeDependency {
  if (isCreateCallerNodeDefinition(key)) {
    return {
      target: value(async (...args: Array<NodeLike>) => {
        if (!key.properties.matcher(args)) {
          throw new Error(`Invalid arguments received by the caller '${key.properties.key}'.`);
        }
        const callNodeDefinition = call(
          parentNode.definition,
          [key.properties.key],
          args.map(toValue),
        );
        const callNode = withScopeFrom(parentNode, callNodeDefinition);
        const result = await resolveTransaction(
          callNode,
          key.properties.disposeEmitter || createEmptyDisposeEmitter(),
        );
        if (isErrorNodeDefinition(result)) {
          throw treeToObject(result);
        }
        return treeToObject(result);
      }),
    };
  }
  if (isCreateSetterNodeDefinition(key)) {
    return {
      target: value(async (val: NodeLike) => {
        if (!key.properties.matcher(val)) {
          throw new Error(`Invalid value received by the setter '${key.properties.key}'.`);
        }
        const setNodeDefinition = set(parentNode.definition, key.properties.key, val);
        const setNode = withScopeFrom(parentNode, setNodeDefinition);
        const result = await resolveTransaction(
          setNode,
          key.properties.disposeEmitter || createEmptyDisposeEmitter(),
        );
        if (isErrorNodeDefinition(result)) {
          throw treeToObject(result);
        }
        return treeToObject(result);
      }),
    };
  }
  if (isDeferNodeDefinition(key)) {
    const { target } = key.properties;
    const resolver = createFieldResolver(parentNode, target);
    return {
      target: ifPending(key.properties.fallbackGenerator, resolver),
    };
  }
  if (isCatchErrorNodeDefinition(key)) {
    const { target } = key.properties;
    const resolver = createFieldResolver(parentNode, target);
    return {
      target: ifError(key.properties.fallbackGenerator, resolver),
    };
  }
  if (isIsPendingNodeDefinition(key)) {
    const { target } = key.properties;
    const resolver = createFieldResolver(parentNode, target);
    return {
      target: ifPending(() => true, resolve([{ target: resolver }], isNotPending)),
    };
  }
  return {
    target: createFieldResolver(parentNode, key),
    acceptNil: true,
  };
}

function isNotPending() {
  return value(false);
}

function createFieldResolver(parentNode: GraphNode, key: KeyNodeDefinition): NodeDefinition {
  const { children } = key.properties;
  return resolve(
    [
      {
        target: get(parentNode.definition, key.properties.key),
        allowErrors: true,
        acceptNil: Boolean(children),
        until: children
          ? isCollectionFieldsNodeDefinition(children)
            ? untilIsCollectionOrFullyResolvedNode
            : untilIsContainerOrFullyResolvedNode
          : untilIsFullyResolvedValueNode,
      },
    ],
    ([resolvedChild]: [GraphNode]): GraphNode => {
      if (ErrorNodeType.is(resolvedChild)) {
        const error = resolvedChild.definition;
        if (error.properties.path) {
          return resolvedChild;
        }
        return withScopeFrom(
          resolvedChild,
          withErrorPath(error, { path: getPath(resolvedChild.context) }),
        );
      }
      if (!children) return resolvedChild;
      return withScopeFrom(resolvedChild, legacyQuery(resolvedChild.definition, children));
    },
  );
}

const untilIsFullyResolvedValueNode: ResolveProperties['until'] = {
  predicate(node: GraphNode): boolean {
    return (
      ValueNodeType.is(node) ||
      QuoteNodeType.is(node) ||
      ErrorNodeType.is(node) ||
      EmptyItemNodeType.is(node)
    );
  },
  errorMessage(node: GraphNode): string {
    if (supportsGetItemsOperation(node)) {
      return 'Invalid query: missing list item fields';
    }
    if (supportsGetChildOperation(node)) {
      return 'Invalid query: missing child fields';
    }
    return getInvalidTypeErrorMessage(
      `${pascalCase(node.definition.type.name)} node cannot be resolved to a value`,
      {
        expected: [ValueNodeType, QuoteNodeType, EmptyItemNodeType],
        received: node.definition,
      },
    );
  },
};

const untilIsCollectionOrFullyResolvedNode: ResolveProperties['until'] = {
  predicate(node: GraphNode): boolean {
    return !supportsEvaluateOperation(node) || supportsGetItemsOperation(node);
  },
  errorMessage(node: GraphNode): string {
    return getInvalidTypeErrorMessage(
      `${pascalCase(node.definition.type.name)} node does not allow list access`,
      { received: node.definition },
    );
  },
};

const untilIsContainerOrFullyResolvedNode: ResolveProperties['until'] = {
  predicate(node: GraphNode): boolean {
    return !supportsEvaluateOperation(node) || supportsGetChildOperation(node);
  },
  errorMessage(node: GraphNode): string {
    return getInvalidTypeErrorMessage(
      `${pascalCase(node.definition.type.name)} node does not allow child access`,
      { received: node.definition },
    );
  },
};

function resolveFields(container: GraphNode, keys: FieldsNode) {
  const fields = keys.definition.properties.fields;
  const keyNames = Object.keys(fields);
  const keyNamesToResolve = keyNames.map((name) => resolveSingleKey(container, fields[name]));
  return withScopeFrom(
    container,
    resolve(keyNamesToResolve, (children: Array<GraphNode>) => {
      const fields = keys.definition.properties.fields;
      const keyNames = Object.keys(fields);
      return withScopeFrom(container, tree(zipObject(keyNames, children.map((c) => c.definition))));
    }),
  );
}

function resolveList(
  iterableNode: GraphNode,
  itemsNode: WithTransformsNode | EntriesNode,
): GraphNode {
  const transforms = WithTransformsNodeType.is(itemsNode)
    ? itemsNode.definition.properties.transforms
    : [];
  const listFieldsNode = (WithTransformsNodeType.is(itemsNode)
    ? withScopeFrom(itemsNode, itemsNode.definition.properties.fields)
    : itemsNode) as EntriesNode;
  return withScopeFrom(
    iterableNode,
    resolve(
      [
        {
          target: traverse(iterableNode, getItemsOperation(transforms)),
          until: {
            predicate: (node: GraphNode) =>
              ArrayNodeType.is(node) ||
              NodeListNodeType.is(node) ||
              ErrorNodeType.is(node) ||
              PlaceholderNodeType.is(node),
            errorMessage(node: GraphNode) {
              return getInvalidTypeErrorMessage('Iterable node resolved to incorrect graph node.', {
                expected: [ArrayNodeType, NodeListNodeType],
                received: node.definition,
              });
            },
          },
          allowErrors: true,
          acceptNil: true,
        },
      ],
      ([resolvedItemsNode]: [PlaceholderNode | NodeListNode | ArrayNode | NilNode | ErrorNode]) =>
        resolveListItems(resolvedItemsNode, listFieldsNode),
    ),
  );
}

function resolveListItems(
  resolvedItemsNode: PlaceholderNode | NodeListNode | ArrayNode | NilNode | ErrorNode,
  listFieldsNode: EntriesNode,
): GraphNode {
  if (ErrorNodeType.is(resolvedItemsNode)) {
    const error = resolvedItemsNode.definition;
    if (error.properties.path) {
      return resolvedItemsNode;
    }
    return withScopeFrom(
      resolvedItemsNode,
      withErrorPath(error, { path: getPath(resolvedItemsNode.context) }),
    );
  }
  if (NilNodeType.is(resolvedItemsNode)) {
    return withScopeFrom(resolvedItemsNode, array([]));
  }
  const { children } = listFieldsNode.definition.properties;
  // Handle the placeholder
  if (PlaceholderNodeType.is(resolvedItemsNode)) {
    if (!children) {
      // Evaluate the placeholder to build up the remote legacyQuery
      return withScopeFrom(
        resolvedItemsNode,
        resolve([{ target: resolvedItemsNode }], () => pending()),
      );
    }
    // Run the legacyQuery against the placeholder to build up the remote legacyQuery
    return withScopeFrom(
      resolvedItemsNode,
      resolve(
        [
          {
            target: withScopeFrom(
              resolvedItemsNode,
              legacyQuery(resolvedItemsNode.definition, children),
            ),
          },
        ],
        () => pending(),
      ),
    );
  }
  const resolvedItems = resolvedItemsNode.definition.properties.items as Array<
    NodeDefinition | GraphNode
  >;
  if (!children) {
    return withScopeFrom(
      resolvedItemsNode,
      resolve(
        resolvedItems.map((item) => ({
          target: item,
          until: untilIsFullyResolvedValueNode,
        })),
        (items) => toItemsArray(resolvedItemsNode, resolvedItems, items),
      ),
    );
  }
  return withScopeFrom(
    resolvedItemsNode,
    resolve(
      resolvedItems.map((item) => ({
        target: isGraphNode(item)
          ? withScopeFrom(item, legacyQuery(item.definition, children))
          : legacyQuery(item, children),
      })),
      (items) => toItemsArray(resolvedItemsNode, resolvedItems, items),
    ),
  );
}

function toItemsArray(
  resolvedItemsNode: GraphNode,
  originalItems: Array<NodeDefinition | GraphNode>,
  nodes: Array<GraphNode>,
): ArrayNodeDefinition {
  return array(
    nodes
      .map((item) =>
        ErrorNodeType.is(item) && !item.definition.properties.path
          ? withErrorPath(item.definition, { path: getPath(resolvedItemsNode.context) })
          : item.definition,
      )
      .filter((item, index) => {
        const originalItem = originalItems[index];
        const originalItemNode = isGraphNode(originalItem) ? originalItem.definition : originalItem;
        return isItemPlaceholderNodeDefinition(originalItemNode)
          ? !originalItemNode.properties.isEmpty
          : true;
      }),
  );
}

export function resolveTransaction(
  node: GraphNode,
  disposeEmitter: (listener: () => void) => DisposeCallback,
): Promise<NodeDefinition> {
  const store = node.scope.store;
  return new Promise((resolve, reject) => {
    withTransaction(node.scope, () => {
      try {
        let isAsync = false;
        let isCompleted = false;
        let unsubscribe: () => void;
        const unsubscribeDispose = disposeEmitter(() => {
          unsubscribe();
          unsubscribeDispose();
        });
        unsubscribe = store.subscribe(node, resolveOperation(), (value: GraphNode) => {
          if (PendingNodeType.is(value)) {
            return;
          }
          isCompleted = true;
          resolve(value.definition);
          if (isAsync) {
            unsubscribeDispose();
            unsubscribe();
          }
        });
        isAsync = true;
        if (isCompleted) {
          unsubscribeDispose();
          unsubscribe();
        }
      } catch (ex) {
        reject(ex);
      }
    });
  });
}

function isCollectionFieldsNodeDefinition(
  value: NodeDefinition,
): value is EntriesNodeDefinition | WithTransformsNodeDefinition {
  return isEntriesNodeDefinition(value) || isWithTransformsNodeDefinition(value);
}
