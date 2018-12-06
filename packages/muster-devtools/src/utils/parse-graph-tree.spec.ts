import muster, {
  ChildKey,
  ContextId,
  createChildPathContext,
  createGraphNode,
  evaluateOperation,
  get,
  getChildOperation,
  GraphNode,
  Muster,
  NodeData,
  NodeDefinition,
  NodeName,
  NodeProperties,
  NodeState,
  NodeType,
  root,
  sanitize,
  ScopeId,
  SerializedGraphNode,
  SerializedGraphOperation,
  SerializedNodeProperties,
  SerializedStore,
  tree,
  upperCase,
  value,
  withScopeFrom,
} from '@dws/muster';
import { operation, runScenario } from '@dws/muster/test';

import { TreeEdge, TreeNode } from '../types/tree-node';
import parseGraphTree from './parse-graph-tree';

function getSerializedStore(
  app: Muster | (() => Muster),
): SerializedStore & {
  scope: ScopeId;
  context: ContextId;
} {
  const muster = typeof app === 'function' ? app() : app;
  return {
    scope: muster.scope.id,
    context: muster.context.id,
    ...muster.scope.store.inspect(),
  };
}

function createTestNode<
  T extends NodeName = NodeName,
  P extends NodeProperties = NodeProperties,
  S extends NodeState = NodeState,
  D extends NodeData = NodeData,
  V extends SerializedNodeProperties = P,
  N extends NodeType<T, P, S, D, V> = NodeType<T, P, S, D, V>
>(app: Muster | (() => Muster), definition: NodeDefinition<T, P, S, D, V, N>): SerializedGraphNode {
  const muster = typeof app === 'function' ? app() : app;
  const node = createGraphNode(muster.scope, muster.context, definition);
  return serializeGraphNode(node);
}

function serializeGraphNode(node: GraphNode): SerializedGraphNode {
  return {
    id: node.id,
    scope: node.scope.id,
    context: node.context.id,
    definition: sanitize(node.definition),
  };
}

function treeNode(
  node: SerializedGraphNode,
  path: Array<SerializedGraphOperation>,
  operations?: Array<TreeEdge<SerializedGraphNode, SerializedGraphOperation>>,
): TreeNode<SerializedGraphNode, SerializedGraphOperation> {
  return {
    value: node,
    edges: operations || [],
    path,
  };
}

function treeEdge(
  operation: SerializedGraphOperation,
  target: TreeNode<SerializedGraphNode, SerializedGraphOperation>,
): TreeEdge<SerializedGraphNode, SerializedGraphOperation> {
  return {
    value: operation,
    target,
  };
}

describe('parseGraphTree()', () => {
  runScenario({
    description: 'GIVEN an empty Muster instance',
    operations: (app) => [
      operation({
        description: 'AND the store is parsed',
        assert() {
          const actual = parseGraphTree(getSerializedStore(app));
          const expected = [treeNode(createTestNode(app, root()), [])];
          expect(actual).toEqual(expected);
        },
      }),
      operation({
        description: 'AND a subscription is created to an orphaned value node',
        input: value('value:foo'),
        assert() {
          const actual = parseGraphTree(getSerializedStore(app));
          const expected = [
            treeNode(createTestNode(app, root()), []),
            treeNode(createTestNode(app, value('value:foo')), []),
          ];
          expect(actual).toEqual(expected);
        },
        operations: (subscriber) => [
          operation({
            description: 'AND the subscription is unsubscribed',
            before() {
              subscriber().subscription.unsubscribe();
            },
            assert() {
              const actual = parseGraphTree(getSerializedStore(app));
              const expected = [treeNode(createTestNode(app, root()), [])];
              expect(actual).toEqual(expected);
            },
          }),
        ],
      }),
    ],
  });

  runScenario({
    description: 'GIVEN a Muster instance with a value at the root node',
    graph: () => muster(value('value:root')),
    operations: (app) => [
      operation({
        description: 'AND a subscription is created to the root node',
        input: root(),
        assert() {
          const actual = parseGraphTree(getSerializedStore(app));
          expect(actual).toEqual([
            treeNode(
              createTestNode(app, root()),
              [],
              [
                treeEdge(
                  sanitize(evaluateOperation()),
                  treeNode(createTestNode(app, value('value:root')), [
                    sanitize(evaluateOperation()),
                  ]),
                ),
              ],
            ),
          ]);
        },
        operations: (rootSubscription) => [
          operation({
            description: 'AND a subscription is created to an orphaned value node',
            input: value('value:foo'),
            assert() {
              const actual = parseGraphTree(getSerializedStore(app));
              const expected = [
                treeNode(
                  createTestNode(app, root()),
                  [],
                  [
                    treeEdge(
                      sanitize(evaluateOperation()),
                      treeNode(createTestNode(app, value('value:root')), [
                        sanitize(evaluateOperation()),
                      ]),
                    ),
                  ],
                ),
                treeNode(createTestNode(app, value('value:foo')), []),
              ];
              expect(actual).toEqual(expected);
            },
            operations: (fooSubscription) => [
              operation({
                description: 'AND the orphaned value node subscription is unsubscribed',
                before() {
                  fooSubscription().subscription.unsubscribe();
                },
                assert() {
                  const actual = parseGraphTree(getSerializedStore(app));
                  const expected = [
                    treeNode(
                      createTestNode(app, root()),
                      [],
                      [
                        treeEdge(
                          sanitize(evaluateOperation()),
                          treeNode(createTestNode(app, value('value:root')), [
                            sanitize(evaluateOperation()),
                          ]),
                        ),
                      ],
                    ),
                  ];
                  expect(actual).toEqual(expected);
                },
              }),
              operation({
                description: 'AND the root subscription is unsubscribed',
                before() {
                  rootSubscription().subscription.unsubscribe();
                },
                assert() {
                  const actual = parseGraphTree(getSerializedStore(app));
                  const expected = [
                    treeNode(createTestNode(app, root()), []),
                    treeNode(createTestNode(app, value('value:foo')), []),
                  ];
                  expect(actual).toEqual(expected);
                },
              }),
              operation({
                description: 'AND a subscription is created to another orphaned value node',
                input: value('value:bar'),
                assert() {
                  const actual = parseGraphTree(getSerializedStore(app));
                  const expected = [
                    treeNode(
                      createTestNode(app, root()),
                      [],
                      [
                        treeEdge(
                          sanitize(evaluateOperation()),
                          treeNode(createTestNode(app, value('value:root')), [
                            sanitize(evaluateOperation()),
                          ]),
                        ),
                      ],
                    ),
                    treeNode(createTestNode(app, value('value:foo')), []),
                    treeNode(createTestNode(app, value('value:bar')), []),
                  ];
                  expect(actual).toEqual(expected);
                },
              }),
            ],
          }),
        ],
      }),
    ],
  });

  runScenario({
    description: 'GIVEN a Muster instance with a tree at the root node',
    graph: () =>
      muster({
        static: 'value:foo',
        dynamic: upperCase(value('value:bar')),
      }),
    operations: (app) => [
      operation({
        description: 'AND a subscription is created to get a static branch of the tree node',
        input: get(root(), value('static')),
        assert() {
          const parentNode = createGraphNode(
            app().scope,
            app().context,
            tree({
              static: value('value:foo'),
              dynamic: upperCase(value('value:bar')),
            }),
          );
          const childNode = getChildNode({
            subject: parentNode,
            key: 'static',
            result: value('value:foo'),
          });
          const actual = parseGraphTree(getSerializedStore(app));
          const expected = [
            treeNode(
              createTestNode(app, root()),
              [],
              [
                treeEdge(
                  sanitize(evaluateOperation()),
                  treeNode(
                    createTestNode(
                      app,
                      tree({
                        static: value('value:foo'),
                        dynamic: upperCase(value('value:bar')),
                      }),
                    ),
                    [sanitize(evaluateOperation())],
                    [
                      treeEdge(
                        sanitize(getChildOperation('static')),
                        treeNode(serializeGraphNode(childNode), [
                          sanitize(evaluateOperation()),
                          sanitize(getChildOperation('static')),
                        ]),
                      ),
                    ],
                  ),
                ),
              ],
            ),
            treeNode(
              createTestNode(app, get(root(), value('static'))),
              [],
              [
                treeEdge(
                  sanitize(evaluateOperation()),
                  treeNode(serializeGraphNode(childNode), [sanitize(evaluateOperation())]),
                ),
              ],
            ),
          ];
          expect(actual).toEqual(expected);
        },
      }),
      operation({
        description: 'AND a subscription is created to get a dynamic branch of the tree node',
        input: get(root(), value('dynamic')),
        assert() {
          const parentNode = createGraphNode(
            app().scope,
            app().context,
            tree({
              static: value('value:foo'),
              dynamic: upperCase(value('value:bar')),
            }),
          );
          const childNode = getChildNode({
            subject: parentNode,
            key: 'dynamic',
            result: upperCase(value('value:bar')),
          });
          const actual = parseGraphTree(getSerializedStore(app));
          const expected = [
            treeNode(
              createTestNode(app, root()),
              [],
              [
                treeEdge(
                  sanitize(evaluateOperation()),
                  treeNode(
                    createTestNode(
                      app,
                      tree({
                        static: value('value:foo'),
                        dynamic: upperCase(value('value:bar')),
                      }),
                    ),
                    [sanitize(evaluateOperation())],
                    [
                      treeEdge(
                        sanitize(getChildOperation('dynamic')),
                        treeNode(
                          serializeGraphNode(childNode),
                          [sanitize(evaluateOperation()), sanitize(getChildOperation('dynamic'))],
                          [
                            treeEdge(
                              sanitize(evaluateOperation()),
                              treeNode(
                                serializeGraphNode(withScopeFrom(childNode, value('VALUE:BAR'))),
                                [
                                  sanitize(evaluateOperation()),
                                  sanitize(getChildOperation('dynamic')),
                                  sanitize(evaluateOperation()),
                                ],
                              ),
                            ),
                          ],
                        ),
                      ),
                    ],
                  ),
                ),
              ],
            ),
            treeNode(
              createTestNode(app, get(root(), value('dynamic'))),
              [],
              [
                treeEdge(
                  sanitize(evaluateOperation()),
                  treeNode(
                    serializeGraphNode(childNode),
                    [sanitize(evaluateOperation())],
                    [
                      treeEdge(
                        sanitize(evaluateOperation()),
                        treeNode(serializeGraphNode(withScopeFrom(childNode, value('VALUE:BAR'))), [
                          sanitize(evaluateOperation()),
                          sanitize(evaluateOperation()),
                        ]),
                      ),
                    ],
                  ),
                ),
              ],
            ),
          ];
          expect(actual).toEqual(expected);
        },
      }),
    ],
  });
});

function getChildNode(options: {
  subject: GraphNode;
  key: ChildKey;
  result: NodeDefinition;
}): GraphNode {
  const { subject, key, result } = options;
  return createGraphNode(subject.scope, createChildPathContext(subject, key), result);
}
