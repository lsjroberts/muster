import { nil } from '.';

import { Muster } from './muster';

const pkg = require('../package.json');

describe('Muster', () => {
  describe('GIVEN a muster instance', () => {
    let app: Muster;
    beforeEach(() => {
      app = new Muster(nil());
    });

    it('SHOULD include the current version number', () => {
      const expected = (pkg as any).version;
      expect(app.version).toBe(expected);
    });
  });
});

// import {
//   asyncIterator,
//   AsyncIteratorNode,
//   AsyncIteratorNodeType,
//   runScenario,
//   errorAtPath,
//   MockSubscriber,
//   operation,
// } from './test';

// import {
//   ChildKey,
//   CustomNode,
//   EventData,
//   GraphNode,
//   ResolverScope,
//   Scoped,
//   ScopedGraphNode,
//   Subscription,
//   createNode,
//   createNodeType,
//   error,
//   value,
//   ref,
//   root,
//   KeyNodeType,
//   GetNodeType,
//   RefNodeType,
//   RootNodeType,
//   ValueNode,
//   ValueNodeType,
// } from '.';

// import { default as Muster } from './muster';

// describe('Muster', () => {
//   runScenario({
//     description: 'GIVEN a Muster app with a simple root node',
//     graph: () => new Muster([RootNodeType, ValueNodeType], value('foo')),
//     operations: [
//       operation({
//         description: 'SHOULD return the root node value',
//         input: root(),
//         expected: value('foo'),
//       }),
//     ],
//   });

//   describe('GIVEN a wrapper node type that returns an inner node', () => {
//     interface WrapperNode extends CustomNode<'wrapper'> {
//       child: GraphNode;
//     }
//     const WrapperNodeType = createNodeType<WrapperNode>('wrapper', {
//       eval(node: WrapperNode, scope: ResolverScope): ScopedGraphNode {
//         return { scope, node: node.child };
//       },
//     });
//     function wrapper(child: GraphNode) {
//       return createNode(WrapperNodeType, { child });
//     }

//     runScenario({
//       description: 'GIVEN a Muster app with a single level of wrapping',
//       graph: () => (
//         new Muster(
//           [RootNodeType, ValueNodeType, WrapperNodeType],
//           wrapper(value('foo')),
//         )
//       ),
//       operations: [
//         operation({
//           description: 'SHOULD resolve the inner node',
//           input: root(),
//           expected: value('foo'),
//         }),
//       ],
//     });

//     runScenario({
//       description: 'GIVEN a Muster app with multiple levels of wrapping',
//       graph: () => (
//         new Muster(
//           [RootNodeType, ValueNodeType, WrapperNodeType],
//           wrapper(wrapper(wrapper(value('foo')))),
//         )
//       ),
//       operations: [
//         operation({
//           description: 'SHOULD resolve the inner node',
//           input: root(),
//           expected: value('foo'),
//         }),
//       ],
//     });
//   });

//   describe('GIVEN a combiner node type that depends on other nodes', () => {
//     interface CombinerNode extends CustomNode<'combiner'> {
//       dependencies: Array<GraphNode>;
//     }
//     const CombinerNodeType = createNodeType<CombinerNode>('combiner', {
//       getDependencies(node: CombinerNode, scope: ResolverScope): Array<ScopedGraphNode> {
//         return node.dependencies.map((dependency) => ({ scope, node: dependency }));
//       },
//       eval(
//         node: CombinerNode,
//         scope: ResolverScope,
//         dependencies: Array<ScopedGraphNode>,
//       ): ScopedGraphNode {
//         if (dependencies.some((dependency) => !ValueNodeType.is(dependency.node))) {
//           return { scope, node: error('Invalid dependencies') };
//         }
//         return {
//           scope,
//           node: value(dependencies.map((dependency: Scoped<ValueNode>) => dependency.node.value)),
//         };
//       },
//     });
//     function combiner(dependencies: Array<GraphNode>): CombinerNode {
//       return createNode(CombinerNodeType, { dependencies });
//     }

//     runScenario({
//       description: 'GIVEN a Muster app with a combiner root node with resolved dependencies',
//       graph: () => (
//         new Muster(
//           [RootNodeType, ValueNodeType, CombinerNodeType],
//           combiner([
//             value('foo'),
//             value('bar'),
//             value('baz'),
//           ]),
//         )
//       ),
//       operations: [
//         operation({
//           description: 'SHOULD resolve the combiner node correctly',
//           input: root(),
//           expected: value(['foo', 'bar', 'baz']),
//         }),
//       ],
//     });

//     describe('AND an uppercase transformer node type', () => {
//       interface UppercaseNode extends CustomNode<'uppercase'> {
//         source: string;
//       }
//       const UppercaseNodeType = createNodeType<UppercaseNode>('uppercase', {
//         eval(node: UppercaseNode, scope: ResolverScope): ScopedGraphNode {
//           return { scope, node: value(node.source.toUpperCase()) };
//         },
//       });
//       function uppercase(source: string): UppercaseNode {
//         return createNode(UppercaseNodeType, { source });
//       }

//       runScenario({
//         description: 'GIVEN a Muster app with a combiner root node with transformed dependencies',
//         graph: () => (
//           new Muster(
//             [RootNodeType, ValueNodeType, CombinerNodeType, UppercaseNodeType],
//             combiner([
//               uppercase('foo'),
//               uppercase('bar'),
//               uppercase('baz'),
//             ]),
//           )
//         ),
//         operations: [
//           operation({
//             description: 'SHOULD resolve the combiner node correctly',
//             input: root(),
//             expected: value(['FOO', 'BAR', 'BAZ']),
//           }),
//         ],
//       });
//     });
//   });

//   describe('GIVEN a parent node type', () => {
//     interface ParentNode extends CustomNode<'parent'> {
//       children: {
//         [key: string]: GraphNode,
//       };
//     }
//     const ParentNodeType = createNodeType<ParentNode>('parent', {
//       getChild(
//         node: ParentNode,
//         scope: ResolverScope,
//         key: ChildKey,
//       ): ScopedGraphNode | undefined {
//         return (key in node.children ? { scope, node: node.children[key] } : undefined);
//       },
//     });
//     function parent(children: {[key: string]: GraphNode}): ParentNode {
//       return createNode(ParentNodeType, { children });
//     }

//     const NODE_TYPES = [
//       GetNodeType,
//       RefNodeType,
//       RootNodeType,
//       ValueNodeType,
//       ParentNodeType,
//       KeyNodeType,
//     ];

//     runScenario({
//       description: 'GIVEN a Muster app with child nodes',
//       graph: () => (
//         new Muster(
//           NODE_TYPES,
//           parent({
//             foo: value('bar'),
//           }),
//         )
//       ),
//       operations: [
//         operation({
//           description: 'SHOULD return child nodes',
//           input: ref(['foo']),
//           expected: value('bar'),
//         }),
//         operation({
//           description: 'SHOULD return an error for nonexistent child nodes',
//           input: ref(['bob']),
//           expected: errorAtPath([], 'Invalid child key: "bob"'),
//         }),
//       ],
//     });

//     runScenario({
//       description: 'GIVEN a Muster app with nested child nodes',
//       graph: () => (
//         new Muster(
//           NODE_TYPES,
//           parent({
//             title: value('Hello, Muster!'),
//             foo: parent({
//               bar: parent({
//                 baz: value('qux'),
//               }),
//             }),
//           }),
//         )
//       ),
//       operations: [
//         operation({
//           description: 'SHOULD return child nodes',
//           input: ref(['title']),
//           expected: value('Hello, Muster!'),
//         }),
//         operation({
//           description: 'SHOULD return an error for nonexistent child nodes',
//           input: ref(['bob']),
//           expected: errorAtPath([], 'Invalid child key: "bob"'),
//         }),
//         operation({
//           description: 'SHOULD return nested child nodes',
//           input: ref(['foo', 'bar', 'baz']),
//           expected: value('qux'),
//         }),
//         operation({
//           description: 'SHOULD return an error for nonexistent nested child nodes',
//           input: ref(['foo', 'bar', 'qux']),
//           expected: errorAtPath(['foo', 'bar'], 'Invalid child key: "qux"'),
//         }),
//       ],
//     });
//   });

//   describe('GIVEN a node type with child scopes', () => {
//     interface CounterNode extends CustomNode<'counter'> {
//       remaining: number;
//     }
//     const CounterNodeType = createNodeType<CounterNode>('counter', {
//       getContextDependencies() {
//         return [
//           {
//             id: 'params',
//             required: false,
//             defaultValue: value({}),
//           },
//         ];
//       },
//       eval(
//         node: CounterNode,
//         scope: ResolverScope,
//         dependencies: Array<never>,
//         [{ node: paramsNode }]: [Scoped<ValueNode>],
//       ): ScopedGraphNode {
//         if (!ValueNodeType.is(paramsNode)) {
//           return { scope, node: error('Invalid parameters') };
//         }
//         const params = (paramsNode).value;
//         if (node.remaining <= 0) {
//           return { scope, node: value(params) };
//         }
//         const updatedParams = {
//           ...params,
//           [String.fromCharCode('a'.charCodeAt(0) + (node.remaining - 1))]: true,
//         };
//         const childScope = scope.cache.createChildScope(scope, {
//           params: value(updatedParams),
//         });
//         return { scope: childScope, node: counter(node.remaining - 1) };
//       },
//     });
//     function counter(remaining: number): CounterNode {
//       return createNode(CounterNodeType, { remaining });
//     }

//     runScenario({
//       description: 'WHEN resolving a simple counter',
//       graph: () => new Muster([RootNodeType, ValueNodeType, CounterNodeType], counter(0)),
//       operations: [
//         operation({
//           description: 'SHOULD return the accumulated result',
//           input: root(),
//           expected: value({}),
//         }),
//       ],
//     });

//     runScenario({
//       description: 'WHEN resolving a recursive counter',
//       graph: () => new Muster([RootNodeType, ValueNodeType, CounterNodeType], counter(3)),
//       operations: [
//         operation({
//           description: 'SHOULD return the accumulated result',
//           input: root(),
//           expected: value({ a: true, b: true, c: true }),
//         }),
//       ],
//     });
//   });

//   describe('events', () => {
//     describe('GIVEN a root node that emits multiple asynchronous items', () => {
//       let app: Muster;
//       let eventSink: jest.Mock<void>;
//       let events: Array<{ type: string, value: EventData | GraphNode }>;
//       let iterator: AsyncIteratorNode;
//       beforeEach(async () => {
//         iterator = asyncIterator([
//           value('foo'),
//           value('bar'),
//           value('baz'),
//         ]);
//         app = new Muster([AsyncIteratorNodeType, ValueNodeType, RootNodeType], iterator);
//         events = [];
//         eventSink = jest.fn<void>((event: EventData) => {
//           events.push({ type: 'event', value: event });
//         });
//         app.scope.globalEvents.listen(eventSink);
//       });

//       describe('AND a subscription is created to the root node', () => {
//         let sink: MockSubscriber;
//         let subscription: Subscription;
//         beforeEach(async () => {
//           const observer = jest.fn<void>((value: GraphNode) => {
//             events.push({ type: 'value', value });
//           });
//           const stream = app.resolve(root());
//           subscription = stream.subscribe(observer);
//           sink = {
//             next: observer,
//             subscription,
//           };
//         });

//         it('SHOULD emit transaction start and end events', () => {
//           expect(eventSink).toHaveBeenCalledTimes(3);
//           expect(eventSink).toHaveBeenCalledWith(
//             { type: '$$event:transactionStart', payload: undefined },
//           );
//           expect(eventSink).toHaveBeenCalledWith(
//             { type: '$$event:transactionEnd', payload: undefined },
//           );
//           expect(eventSink).toHaveBeenCalledWith(
//             { type: '$$event:flush', payload: undefined },
//           );
//         });

//         it('SHOULD emit the initial value', () => {
//           expect(sink.next).toHaveBeenCalledTimes(1);
//           expect(sink.next).toHaveBeenCalledWith({ $type: 'value', value: 'foo' });
//         });

//         it('SHOULD emit events in the correct order', () => {
//           expect(events).toEqual([
//             { type: 'event', value: { type: '$$event:transactionStart', payload: undefined } },
//             { type: 'event', value: { type: '$$event:transactionEnd', payload: undefined } },
//             { type: 'event', value: { type: '$$event:flush', payload: undefined } },
//             { type: 'value', value: { $type: 'value', value: 'foo' } },
//           ]);
//         });

//         describe('AND the node emits more values', () => {
//           beforeEach(() => {
//             jest.clearAllMocks();
//             iterator.next();
//             iterator.next();
//           });

//           it('SHOULD NOT emit transaction start and end events', () => {
//             expect(eventSink).toHaveBeenCalledTimes(6);
//             expect(eventSink).toHaveBeenCalledWith(
//               { type: '$$event:transactionStart', payload: undefined },
//             );
//             expect(eventSink).toHaveBeenCalledWith(
//               { type: '$$event:transactionEnd', payload: undefined },
//             );
//             expect(eventSink).toHaveBeenCalledWith(
//               { type: '$$event:flush', payload: undefined },
//             );
//           });

//           it('SHOULD emit values', () => {
//             expect(sink.next).toHaveBeenCalledTimes(2);
//             expect(sink.next).toHaveBeenCalledWith({ $type: 'value', value: 'bar' });
//             expect(sink.next).toHaveBeenCalledWith({ $type: 'value', value: 'baz' });
//           });

//           it('SHOULD emit events in the correct order', () => {
//             expect(events).toEqual([
//               { type: 'event', value: { type: '$$event:transactionStart', payload: undefined } },
//               { type: 'event', value: { type: '$$event:transactionEnd', payload: undefined } },
//               { type: 'event', value: { type: '$$event:flush', payload: undefined } },
//               { type: 'value', value: { $type: 'value', value: 'foo' } },
//               { type: 'event', value: { type: '$$event:transactionStart', payload: undefined } },
//               { type: 'event', value: { type: '$$event:transactionEnd', payload: undefined } },
//               { type: 'event', value: { type: '$$event:flush', payload: undefined } },
//               { type: 'value', value: { $type: 'value', value: 'bar' } },
//               { type: 'event', value: { type: '$$event:transactionStart', payload: undefined } },
//               { type: 'event', value: { type: '$$event:transactionEnd', payload: undefined } },
//               { type: 'event', value: { type: '$$event:flush', payload: undefined } },
//               { type: 'value', value: { $type: 'value', value: 'baz' } },
//             ]);
//           });
//         });

//         describe('AND the subscription is unsubscribed', () => {
//           beforeEach(() => {
//             subscription.unsubscribe();
//           });

//           describe('AND a new subscription is created to the root node', () => {
//             let sink2: MockSubscriber;
//             beforeEach(async () => {
//               jest.clearAllMocks();
//               events.length = 0;
//               const observer = jest.fn<void>((value: GraphNode) => {
//                 events.push({ type: 'value', value });
//               });
//               const stream = app.resolve(root());
//               stream.subscribe(observer);
//               sink2 = {
//                 next: observer,
//                 subscription,
//               };
//             });

//             it('SHOULD emit transaction start and end events', () => {
//               expect(eventSink).toHaveBeenCalledTimes(3);
//               expect(eventSink).toHaveBeenCalledWith(
//                 { type: '$$event:transactionStart', payload: undefined },
//               );
//               expect(eventSink).toHaveBeenCalledWith(
//                 { type: '$$event:transactionEnd', payload: undefined },
//               );
//               expect(eventSink).toHaveBeenCalledWith(
//                 { type: '$$event:flush', payload: undefined },
//               );
//             });

//             it('SHOULD emit the initial value', () => {
//               expect(sink2.next).toHaveBeenCalledTimes(1);
//               expect(sink2.next).toHaveBeenCalledWith({ $type: 'value', value: 'foo' });
//             });

//             it('SHOULD emit events in the correct order', () => {
//               expect(events).toEqual([
//                 { type: 'event', value: { type: '$$event:transactionStart', payload: undefined } },
//                 { type: 'event', value: { type: '$$event:transactionEnd', payload: undefined } },
//                 { type: 'event', value: { type: '$$event:flush', payload: undefined } },
//                 { type: 'value', value: { $type: 'value', value: 'foo' } },
//               ]);
//             });
//           });
//         });
//       });
//     });
//   });
// });
