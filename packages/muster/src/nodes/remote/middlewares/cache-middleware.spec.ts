describe('cacheMiddleware()', () => {
  it('SHOULD be empty', () => {});
});

// import { BehaviorSubject, ObservableLike } from '@dws/muster-observable';
// import muster, {
//   action,
//   array,
//   ascending,
//   call,
//   combineLatest,
//   descending,
//   dispatch,
//   entries,
//   fromStream,
//   fromStreamMiddleware,
//   get,
//   invalidate,
//   key,
//   mockResponseMiddleware,
//   Muster,
//   NodeDefinition,
//   proxy,
//   query,
//   ref,
//   reset,
//   root,
//   series,
//   set,
//   sort,
//   tree,
//   value,
//   variable,
//   withTransforms,
// } from '../../..';
// import { operation, runScenario } from '../../../test';
// import { filter } from '../../collection/transforms/filter';
// import { ok } from '../../graph/ok';
// import { gt } from '../../logic/gt';
// import { lt } from '../../logic/lt';
// import { cacheMiddleware, resetCacheForPaths } from './cache-middleware';
//
// describe('cacheMiddleware()', () => {
//   let nextResponseId: number;
//   let mockMiddleware: jest.Mock<NodeDefinition>;
//
//   beforeEach(() => {
//     nextResponseId = 1;
//     mockMiddleware = jest.fn((request) => {
//       const responseId = nextResponseId;
//       nextResponseId += 1;
//       return array([
//         tree({
//           '0:value': value(`Response ${responseId}`),
//         }),
//       ]);
//     });
//   });
//
//   describe('Cache a single value', () => {
//     runScenario({
//       description: 'GIVEN a proxy node with a cache middleware',
//       graph: () => muster({
//         proxy: proxy([
//           cacheMiddleware(true),
//           mockResponseMiddleware(mockMiddleware),
//         ]),
//       }),
//       operations: [
//         operation({
//           description: 'WHEN the value gets requested from the server for the first time',
//           input: ref('proxy', 'value'),
//           expected: value('Response 1'),
//           assert() {
//             expect(mockMiddleware).toHaveBeenCalledTimes(1);
//           },
//           operations: (firstSubscriber) => [
//             operation({
//               description: 'AND the value gets requested for the second time',
//               before() { jest.clearAllMocks(); },
//               input: ref('proxy', 'value'),
//               expected: value('Response 1'),
//               assert() {
//                 expect(mockMiddleware).not.toHaveBeenCalled();
//               },
//             }),
//             operation({
//               description: 'AND the subscription for the value gets cleared',
//               before() { firstSubscriber().subscription.unsubscribe(); },
//               operations: [
//                 operation({
//                   description: 'AND the value gets requested for the second time',
//                   before() {
//                     jest.clearAllMocks();
//                   },
//                   input: ref('proxy', 'value'),
//                   expected: value('Response 1'),
//                   assert() {
//                     expect(mockMiddleware).not.toHaveBeenCalled();
//                   },
//                 }),
//               ],
//             }),
//           ],
//         }),
//       ],
//     });
//   });
//
//   describe('Cache simple value (ref to cache middleware)', () => {
//     runScenario({
//       description: 'GIVEN a proxy node with a ref to a cache middleware',
//       graph: () => muster({
//         cache: cacheMiddleware(true),
//         proxy: proxy([
//           ref('cache'),
//           mockResponseMiddleware(mockMiddleware),
//         ]),
//       }),
//       operations: [
//         operation({
//           description: 'WHEN the value gets requested from the server for the first time',
//           input: ref('proxy', 'value'),
//           expected: value('Response 1'),
//           assert() {
//             expect(mockMiddleware).toHaveBeenCalledTimes(1);
//           },
//           operations: (firstSubscriber) => [
//             operation({
//               description: 'AND the value gets requested for the second time',
//               before() { jest.clearAllMocks(); },
//               input: ref('proxy', 'value'),
//               expected: value('Response 1'),
//               assert() {
//                 expect(mockMiddleware).not.toHaveBeenCalled();
//               },
//               operations: (secondSubscriber) => [
//                 operation({
//                   description: 'AND the cache gets reset',
//                   before() { jest.clearAllMocks(); },
//                   input: reset('cache'),
//                   assert() {
//                     expect(mockMiddleware).not.toHaveBeenCalled();
//                   },
//                   operations: [
//                     operation({
//                       description: 'AND the proxy gets invalidated',
//                       before() {
//                         jest.clearAllMocks();
//                       },
//                       input: invalidate('proxy'),
//                       assert() {
//                         expect(mockMiddleware).toHaveBeenCalledTimes(1);
//                         expect(firstSubscriber().next).toHaveBeenCalledTimes(1);
//                         expect(secondSubscriber().next).toHaveBeenCalledTimes(1);
//                       },
//                     }),
//                   ],
//                 }),
//               ],
//             }),
//             operation({
//               description: 'AND the value gets freshly requested for the second time',
//               before() {
//                 jest.clearAllMocks();
//                 firstSubscriber().subscription.unsubscribe();
//               },
//               input: ref('proxy', 'value'),
//               expected: value('Response 1'),
//               assert() {
//                 expect(mockMiddleware).not.toHaveBeenCalled();
//               },
//               operations: (secondSubscriber) => [
//                 operation({
//                   description: 'AND the cache gets reset',
//                   before() {
//                     jest.clearAllMocks();
//                     secondSubscriber().subscription.unsubscribe();
//                   },
//                   input: reset('cache'),
//                   assert() {
//                     expect(mockMiddleware).not.toHaveBeenCalled();
//                   },
//                   operations: [
//                     operation({
//                       description: 'AND the value gets requested for the third time',
//                       input: ref('proxy', 'value'),
//                       expected: value('Response 2'),
//                       assert() {
//                         expect(mockMiddleware).toHaveBeenCalledTimes(1);
//                       },
//                     }),
//                   ],
//                 }),
//               ],
//             }),
//           ],
//         }),
//       ],
//     });
//   });
//
//   describe('Cached query with simple fields, request same data twice', () => {
//     let remoteMuster: Muster;
//     let mockRemoteMuster: jest.Mock<ObservableLike<NodeDefinition>>;
//
//     beforeEach(() => {
//       remoteMuster = muster({
//         first: 'first name',
//         last: 'last name',
//         address: {
//           street: 'street name',
//         },
//       });
//       mockRemoteMuster = jest.fn((req) => remoteMuster.resolve(req, { raw: true }))
//     });
//
//     runScenario({
//       description: 'GIVEN a local instance of muster connected to the remote',
//       graph: () => muster({
//         remote: proxy([
//           cacheMiddleware(true),
//           fromStreamMiddleware(mockRemoteMuster),
//         ]),
//       }),
//       operations: [
//         operation({
//           description: 'WHEN the query is sent for the first time',
//           input: query(ref('remote'), {
//             first: key('first'),
//             last: key('last'),
//             address: key('address', {
//               street: key('street'),
//             }),
//           }),
//           expected: tree({
//             first: value('first name'),
//             last: value('last name'),
//             address: tree({
//               street: value('street name'),
//             }),
//           }),
//           assert() {
//             expect(mockRemoteMuster).toHaveBeenCalledTimes(1);
//           },
//           operations: (subscriber) => [
//             operation({
//               description: 'AND the query gets made for the second time',
//               before() {
//                 jest.clearAllMocks();
//                 subscriber().subscription.unsubscribe();
//               },
//               input: query(ref('remote'), {
//                 first: key('first'),
//                 last: key('last'),
//                 address: key('address', {
//                   street: key('street'),
//                 }),
//               }),
//               expected: tree({
//                 first: value('first name'),
//                 last: value('last name'),
//                 address: tree({
//                   street: value('street name'),
//                 }),
//               }),
//               assert() {
//                 expect(mockRemoteMuster).not.toHaveBeenCalled();
//               },
//             }),
//           ],
//         }),
//       ],
//     });
//   });
//
//   describe('Cache query with simple fields; second request requires one more field', () => {
//     let remoteMuster: Muster;
//     let mockRemoteMuster: jest.Mock<ObservableLike<NodeDefinition>>;
//
//     beforeEach(() => {
//       remoteMuster = muster({
//         first: 'first value',
//         second: 'second value',
//         nested: {
//           first: 'nested first value',
//           second: 'nested second value',
//         },
//       });
//       mockRemoteMuster = jest.fn((req) => remoteMuster.resolve(req, { raw: true }));
//     });
//
//     runScenario({
//       description: 'GIVEN a local instance connected to the remote',
//       graph: () => muster({
//         remote: proxy([
//           cacheMiddleware(true),
//           fromStreamMiddleware(mockRemoteMuster),
//         ]),
//       }),
//       operations: [
//         operation({
//           description: 'WHEN the query is made only for the first fields',
//           input: query(ref('remote'), {
//             first: key('first'),
//             nested: key('nested', {
//               first: key('first'),
//             }),
//           }),
//           expected: tree({
//             first: value('first value'),
//             nested: tree({
//               first: value('nested first value'),
//             }),
//           }),
//           assert() {
//             expect(mockRemoteMuster).toHaveBeenCalledTimes(1);
//             expect(mockRemoteMuster).toHaveBeenCalledWith(combineLatest([
//               query(root(), {
//                 '0:first': key('first'),
//                 '1:nested': key('nested', {
//                   '0:first': key('first'),
//                 }),
//               }),
//             ]));
//           },
//           operations: (subscriber) => [
//             operation({
//               description: 'AND the second query is made for all fields',
//               before() {
//                 jest.clearAllMocks();
//                 subscriber().subscription.unsubscribe();
//               },
//               input: query(ref('remote'), {
//                 first: key('first'),
//                 second: key('second'),
//                 nested: key('nested', {
//                   first: key('first'),
//                   second: key('second'),
//                 }),
//               }),
//               expected: tree({
//                 first: value('first value'),
//                 second: value('second value'),
//                 nested: tree({
//                   first: value('nested first value'),
//                   second: value('nested second value'),
//                 }),
//               }),
//               assert() {
//                 expect(mockRemoteMuster).toHaveBeenCalledTimes(1);
//                 expect(mockRemoteMuster).toHaveBeenCalledWith(combineLatest([
//                   query(root(), {
//                     '1:second': key('second'),
//                     '2:nested': key('nested', {
//                       '1:second': key('second'),
//                     }),
//                   })
//                 ]));
//               },
//             }),
//           ],
//         }),
//       ],
//     });
//   });
//
//   describe('Cache query for simple list, second request for the same list', () => {
//     let remoteMuster: Muster;
//     let mockRemoteMuster: jest.Mock<ObservableLike<NodeDefinition>>;
//
//     beforeEach(() => {
//       remoteMuster = muster({
//         numbers: [1, 2, 3, 4],
//       });
//       mockRemoteMuster = jest.fn((req) => remoteMuster.resolve(req, { raw: true }));
//     });
//
//     runScenario({
//       description: 'GIVEN a local instance of muster connected to the remote',
//       graph: () => muster({
//         remote: proxy([
//           cacheMiddleware(true),
//           fromStreamMiddleware(mockRemoteMuster),
//         ]),
//       }),
//       operations: [
//         operation({
//           description: 'WHEN the query is made for the list of numbers',
//           input: query(ref('remote'), {
//             numbers: key('numbers', entries()),
//           }),
//           expected: tree({
//             numbers: array([
//               value(1),
//               value(2),
//               value(3),
//               value(4),
//             ]),
//           }),
//           assert() {
//             expect(mockRemoteMuster).toHaveBeenCalledTimes(1);
//           },
//           operations: (subscriber) => [
//             operation({
//               description: 'AND the query is made for the second time',
//               before() {
//                 jest.clearAllMocks();
//                 subscriber().subscription.unsubscribe();
//               },
//               input: query(ref('remote'), {
//                 numbers: key('numbers', entries()),
//               }),
//               expected: tree({
//                 numbers: array([
//                   value(1),
//                   value(2),
//                   value(3),
//                   value(4),
//                 ]),
//               }),
//               assert() {
//                 expect(mockRemoteMuster).not.toHaveBeenCalled();
//               },
//             }),
//           ],
//         }),
//       ],
//     });
//   });
//
//   describe('Cache query for simple list, second request adds one more leaf', () => {
//     let remoteMuster: Muster;
//     let mockRemoteMuster: jest.Mock<ObservableLike<NodeDefinition>>;
//
//     beforeEach(() => {
//       remoteMuster = muster({
//         numbers: [1, 2, 3],
//         first: 'first value',
//       });
//       mockRemoteMuster = jest.fn((req) => remoteMuster.resolve(req, { raw: true }));
//     });
//
//     runScenario({
//       description: 'GIVEN a local instance of muster connected to the remote',
//       graph: () => muster({
//         remote: proxy([
//           cacheMiddleware(true),
//           fromStreamMiddleware(mockRemoteMuster),
//         ]),
//       }),
//       operations: [
//         operation({
//           description: 'WHEN the query is made for the list of numbers',
//           input: query(ref('remote'), {
//             numbers: key('numbers', entries()),
//           }),
//           expected: tree({
//             numbers: array([
//               value(1),
//               value(2),
//               value(3),
//             ]),
//           }),
//           assert() {
//             expect(mockRemoteMuster).toHaveBeenCalledTimes(1);
//             expect(mockRemoteMuster).toHaveBeenCalledWith(combineLatest([
//               query(root(), {
//                 '0:numbers': key('numbers', entries()),
//               }),
//             ]));
//           },
//           operations: (subscriber) => [
//             operation({
//               description: 'AND the second query request additionally the `first` field',
//               before() {
//                 jest.clearAllMocks();
//                 subscriber().subscription.unsubscribe();
//               },
//               input: query(ref('remote'), {
//                 numbers: key('numbers', entries()),
//                 first: key('first'),
//               }),
//               expected: tree({
//                 numbers: array([
//                   value(1),
//                   value(2),
//                   value(3),
//                 ]),
//                 first: value('first value'),
//               }),
//               assert() {
//                 expect(mockRemoteMuster).toHaveBeenCalledTimes(1);
//                 expect(mockRemoteMuster).toHaveBeenCalledWith(combineLatest([
//                   query(root(), {
//                     '1:first': key('first'),
//                   }),
//                 ]));
//               },
//             }),
//           ],
//         }),
//       ],
//     });
//   });
//
//   describe('Cache a query for a list with fields, second request for the same list', () => {
//     let remoteMuster: Muster;
//     let mockRemoteMuster: jest.Mock<ObservableLike<NodeDefinition>>;
//
//     beforeEach(() => {
//       remoteMuster = muster({
//         items: [
//           { name: 'first item' },
//           { name: 'second item' },
//           { name: 'third item' },
//         ],
//       });
//       mockRemoteMuster = jest.fn((req) => remoteMuster.resolve(req, { raw: true }));
//     });
//
//     runScenario({
//       description: 'GIVEN a local instance of muster connected to the remote',
//       graph: () => muster({
//         remote: proxy([
//           cacheMiddleware(true),
//           fromStreamMiddleware(mockRemoteMuster),
//         ]),
//       }),
//       operations: [
//         operation({
//           description: 'WHEN the query is made for the list',
//           input: query(ref('remote'), {
//             items: key('items', entries({
//               name: key('name'),
//             })),
//           }),
//           expected: tree({
//             items: array([
//               tree({ name: value('first item') }),
//               tree({ name: value('second item') }),
//               tree({ name: value('third item') }),
//             ]),
//           }),
//           assert() {
//             expect(mockRemoteMuster).toHaveBeenCalledTimes(1);
//           },
//           operations: (subscriber) => [
//             operation({
//               description: 'AND the query is made for the second time',
//               before() {
//                 jest.clearAllMocks();
//                 subscriber().subscription.unsubscribe();
//               },
//               input: query(ref('remote'), {
//                 items: key('items', entries({
//                   name: key('name'),
//                 })),
//               }),
//               expected: tree({
//                 items: array([
//                   tree({ name: value('first item') }),
//                   tree({ name: value('second item') }),
//                   tree({ name: value('third item') }),
//                 ]),
//               }),
//               assert() {
//                 expect(mockRemoteMuster).not.toHaveBeenCalled();
//               },
//             }),
//           ],
//         }),
//       ],
//     });
//   });
//
//   describe('Cache a query for a list with fields, second query requests additional field', () => {
//     let remoteMuster: Muster;
//     let mockRemoteMuster: jest.Mock<ObservableLike<NodeDefinition>>;
//
//     beforeEach(() => {
//       remoteMuster = muster({
//         items: [
//           { name: 'first item' },
//           { name: 'second item' },
//           { name: 'third item' },
//         ],
//         first: 'first value',
//       });
//       mockRemoteMuster = jest.fn((req) => remoteMuster.resolve(req, { raw: true }));
//     });
//
//     runScenario({
//       description: 'GIVEN a local muster instance connected to the remote',
//       graph: () => muster({
//         remote: proxy([
//           cacheMiddleware(true),
//           fromStreamMiddleware(mockRemoteMuster),
//         ]),
//       }),
//       operations: [
//         operation({
//           description: 'WHEN the query is made for the list',
//           input: query(ref('remote'), {
//             items: key('items', entries({
//               name: key('name'),
//             })),
//           }),
//           expected: tree({
//             items: array([
//               tree({ name: value('first item') }),
//               tree({ name: value('second item') }),
//               tree({ name: value('third item') }),
//             ]),
//           }),
//           assert() {
//             expect(mockRemoteMuster).toHaveBeenCalledTimes(1);
//             expect(mockRemoteMuster).toHaveBeenCalledWith(combineLatest([
//               query(root(), {
//                 '0:items': key('items', entries({
//                   '0:name': key('name'),
//                 })),
//               }),
//             ]));
//           },
//           operations: (subscriber) => [
//             operation({
//               description: 'AND the second query requests an additional field',
//               before() {
//                 jest.clearAllMocks();
//                 subscriber().subscription.unsubscribe();
//               },
//               input: query(ref('remote'), {
//                 items: key('items', entries({
//                   name: key('name'),
//                 })),
//                 first: key('first'),
//               }),
//               expected: tree({
//                 items: array([
//                   tree({ name: value('first item') }),
//                   tree({ name: value('second item') }),
//                   tree({ name: value('third item') }),
//                 ]),
//                 first: value('first value'),
//               }),
//               assert() {
//                 expect(mockRemoteMuster).toHaveBeenCalledTimes(1);
//                 expect(mockRemoteMuster).toHaveBeenCalledWith(combineLatest([
//                   query(root(), {
//                     '1:first': key('first'),
//                   }),
//                 ]));
//               },
//             }),
//           ],
//         }),
//       ],
//     });
//   });
//
//   describe('Cache a query for a simple list with same transforms', () => {
//     let remoteMuster: Muster;
//     let mockRemoteMuster: jest.Mock<ObservableLike<NodeDefinition>>;
//
//     beforeEach(() => {
//       remoteMuster = muster({
//         numbers: [1, 2, 3],
//       });
//       mockRemoteMuster = jest.fn((req) => remoteMuster.resolve(req, { raw: true }));
//     });
//
//     runScenario({
//       description: 'GIVEN a local instance of muster connected to the remote',
//       graph: () => muster({
//         remote: proxy([
//           cacheMiddleware(true),
//           fromStreamMiddleware(mockRemoteMuster),
//         ]),
//       }),
//       operations: [
//         operation({
//           description: 'WHEN the query requests numbers less than 3',
//           input: query(ref('remote'), {
//             numbers: key('numbers', withTransforms([
//               filter((item: NodeDefinition) => lt(item, 3)),
//             ], entries())),
//           }),
//           expected: tree({
//             numbers: array([
//               value(1),
//               value(2),
//             ]),
//           }),
//           assert() {
//             expect(mockRemoteMuster).toHaveBeenCalledTimes(1);
//           },
//           operations: (subscriber) => [
//             operation({
//               description: 'AND the query gets sent again',
//               before() {
//                 jest.clearAllMocks();
//                 subscriber().subscription.unsubscribe();
//               },
//               input: query(ref('remote'), {
//                 numbers: key('numbers', withTransforms([
//                   filter((item: NodeDefinition) => lt(item, 3)),
//                 ], entries())),
//               }),
//               expected: tree({
//                 numbers: array([
//                   value(1),
//                   value(2),
//                 ]),
//               }),
//               assert() {
//                 expect(mockRemoteMuster).not.toHaveBeenCalled();
//               }
//             }),
//           ],
//         }),
//       ],
//     });
//   });
//
//   describe('Cache a query for a simple list with different transforms', () => {
//     let remoteMuster: Muster;
//     let mockRemoteMuster: jest.Mock<ObservableLike<NodeDefinition>>;
//
//     beforeEach(() => {
//       remoteMuster = muster({
//         numbers: [1, 2, 3],
//       });
//       mockRemoteMuster = jest.fn((req) => remoteMuster.resolve(req, { raw: true }));
//     });
//
//     runScenario({
//       description: 'GIVEN a local instance of muster connected to the remote',
//       graph: () => muster({
//         remote: proxy([
//           cacheMiddleware(true),
//           fromStreamMiddleware(mockRemoteMuster),
//         ]),
//       }),
//       operations: [
//         operation({
//           description: 'WHEN the query requests numbers less than 3',
//           input: query(ref('remote'), {
//             numbers: key('numbers', withTransforms([
//               filter((item: NodeDefinition) => lt(item, 3)),
//             ], entries())),
//           }),
//           expected: tree({
//             numbers: array([
//               value(1),
//               value(2),
//             ]),
//           }),
//           assert() {
//             expect(mockRemoteMuster).toHaveBeenCalledTimes(1);
//           },
//           operations: (subscriber) => [
//             operation({
//               description: 'AND the query gets sent again with different filters',
//               before() {
//                 jest.clearAllMocks();
//                 subscriber().subscription.unsubscribe();
//               },
//               input: query(ref('remote'), {
//                 numbers: key('numbers', withTransforms([
//                   filter((item: NodeDefinition) => gt(item, 1)),
//                 ], entries())),
//               }),
//               expected: tree({
//                 numbers: array([
//                   value(2),
//                   value(3),
//                 ]),
//               }),
//             }),
//             operation({
//               description: 'AND the query gets sent again with different filters',
//               before() {
//                 jest.clearAllMocks();
//                 subscriber().subscription.unsubscribe();
//               },
//               input: query(ref('remote'), {
//                 numbers: key('numbers', withTransforms([
//                   filter((item: NodeDefinition) => gt(item, 1)),
//                 ], entries())),
//               }),
//               assert() {
//                 expect(mockRemoteMuster).toHaveBeenCalledTimes(1);
//               },
//             }),
//           ],
//         }),
//       ],
//     });
//   });
//
//   describe('Caching a query for list with fields and transforms, second query is the same', () => {
//     let remoteMuster: Muster;
//     let mockRemoteMuster: jest.Mock<ObservableLike<NodeDefinition>>;
//
//     beforeEach(() => {
//       remoteMuster = muster({
//         items: [
//           { name: 'first item' },
//           { name: 'second item' },
//           { name: 'third item' },
//         ],
//       });
//       mockRemoteMuster = jest.fn((req) => remoteMuster.resolve(req, { raw: true }));
//     });
//
//     runScenario({
//       description: 'GIVEN a local instance of muster connected to the remote',
//       graph: () => muster({
//         remote: proxy([
//           cacheMiddleware(true),
//           fromStreamMiddleware(mockRemoteMuster),
//         ]),
//       }),
//       operations: [
//         operation({
//           description: 'WHEN the query is made for the first time',
//           input: query(ref('remote'), {
//             items: key('items', withTransforms([
//               sort(ascending((item) => get(item, 'name'))),
//             ], entries({
//               name: key('name'),
//             }))),
//           }),
//           expected: tree({
//             items: array([
//               tree({ name: value('first item') }),
//               tree({ name: value('second item') }),
//               tree({ name: value('third item') }),
//             ]),
//           }),
//           assert() {
//             expect(mockRemoteMuster).toHaveBeenCalledTimes(1);
//           },
//           operations: (subscriber) => [
//             operation({
//               description: 'AND the second query is made with same transforms',
//               before() {
//                 jest.clearAllMocks();
//                 subscriber().subscription.unsubscribe();
//               },
//               input: query(ref('remote'), {
//                 items: key('items', withTransforms([
//                   sort(ascending((item) => get(item, 'name'))),
//                 ], entries({
//                   name: key('name'),
//                 },))),
//               }),
//               expected: tree({
//                 items: array([
//                   tree({ name: value('first item') }),
//                   tree({ name: value('second item') }),
//                   tree({ name: value('third item') }),
//                 ]),
//               }),
//               assert() {
//                 expect(mockRemoteMuster).not.toHaveBeenCalled();
//               },
//             }),
//           ],
//         }),
//       ],
//     });
//   });
//
//   describe('Caching a query for list with fields and transforms, second query is different', () => {
//     let remoteMuster: Muster;
//     let mockRemoteMuster: jest.Mock<ObservableLike<NodeDefinition>>;
//
//     beforeEach(() => {
//       remoteMuster = muster({
//         items: [
//           { name: 'first item' },
//           { name: 'second item' },
//           { name: 'third item' },
//         ],
//       });
//       mockRemoteMuster = jest.fn((req) => remoteMuster.resolve(req, { raw: true }));
//     });
//
//     runScenario({
//       description: 'GIVEN a local instance of muster connected to the remote',
//       graph: () => muster({
//         remote: proxy([
//           cacheMiddleware(true),
//           fromStreamMiddleware(mockRemoteMuster),
//         ]),
//       }),
//       operations: [
//         operation({
//           description: 'WHEN the query is made for the first time',
//           input: query(ref('remote'), {
//             items: key('items', withTransforms([
//               sort(ascending((item) => get(item, 'name'))),
//             ], entries({
//               name: key('name'),
//             },))),
//           }),
//           expected: tree({
//             items: array([
//               tree({ name: value('first item') }),
//               tree({ name: value('second item') }),
//               tree({ name: value('third item') }),
//             ]),
//           }),
//           assert() {
//             expect(mockRemoteMuster).toHaveBeenCalledTimes(1);
//           },
//           operations: (subscriber) => [
//             operation({
//               description: 'AND the second query is made with different transforms',
//               before() {
//                 jest.clearAllMocks();
//                 subscriber().subscription.unsubscribe();
//               },
//               input: query(ref('remote'), {
//                 items: key('items', withTransforms([
//                   sort(descending((item) => get(item, 'name'))),
//                 ], entries({
//                   name: key('name'),
//                 }))),
//               }),
//               expected: tree({
//                 items: array([
//                   tree({ name: value('third item') }),
//                   tree({ name: value('second item') }),
//                   tree({ name: value('first item') }),
//                 ]),
//               }),
//               assert() {
//                 expect(mockRemoteMuster).toHaveBeenCalledTimes(1);
//               },
//             }),
//           ],
//         }),
//       ],
//     });
//   });
//
//   describe('Caching a query to a simple list with transforms using a changing variable', () => {
//     let remoteMuster: Muster;
//     let mockRemoteMuster: jest.Mock<ObservableLike<NodeDefinition>>;
//
//     beforeEach(() => {
//       remoteMuster = muster({
//         numbers: [1, 2, 3, 4],
//       });
//       mockRemoteMuster = jest.fn((req) => remoteMuster.resolve(req, { raw: true }));
//     });
//
//     runScenario({
//       description: 'GIVEN a local instance of muster connected to the remote',
//       graph: () => muster({
//         remote: proxy([
//           cacheMiddleware(true),
//           fromStreamMiddleware(mockRemoteMuster),
//         ]),
//         minValue: variable(1),
//       }),
//       operations: [
//         operation({
//           description: 'WHEN a query is made with minValue = 1',
//           input: query(ref('remote'), {
//             numbers: key('numbers', withTransforms([
//               filter((item: NodeDefinition) => gt(item, ref('minValue'))),
//             ], entries())),
//           }),
//           expected: tree({
//             numbers: array([
//               value(2),
//               value(3),
//               value(4),
//             ]),
//           }),
//           assert() {
//             expect(mockRemoteMuster).toHaveBeenCalledTimes(1);
//           },
//           operations: (subscriber) => [
//             operation({
//               description: 'AND the minValue changes to 2',
//               before() {
//                 subscriber().subscription.unsubscribe();
//               },
//               input: set('minValue', 2),
//               expected: value(2),
//               operations: [
//                 operation({
//                   description: 'AND the query is made with minValue = 2',
//                   before() {
//                     jest.clearAllMocks();
//                   },
//                   input: query(ref('remote'), {
//                     numbers: key('numbers', withTransforms([
//                       filter((item: NodeDefinition) => gt(item, ref('minValue'))),
//                     ], entries())),
//                   }),
//                   expected: tree({
//                     numbers: array([
//                       value(3),
//                       value(4),
//                     ]),
//                   }),
//                   assert() {
//                     expect(mockRemoteMuster).toHaveBeenCalledTimes(1);
//                   },
//                 }),
//               ],
//             }),
//           ],
//         }),
//       ],
//     });
//   });
//
//   // TODO: Fix this unit test
//   xdescribe('Caching a query to a list, second query requests same list with different fields', () => {
//     let remoteMuster: Muster;
//     let mockRemoteMuster: jest.Mock<ObservableLike<NodeDefinition>>;
//
//     beforeEach(() => {
//       remoteMuster = muster({
//         items: [
//           { name: 'first name', description: 'first description' },
//           { name: 'second name', description: 'second description' },
//           { name: 'third name', description: 'third description' },
//         ],
//       });
//       mockRemoteMuster = jest.fn((req) => remoteMuster.resolve(req, { raw: true }));
//     });
//
//     runScenario({
//       description: 'GIVEN a local instance of muster connected to the remote',
//       graph: () => muster({
//         remote: proxy([
//           cacheMiddleware(true),
//           fromStreamMiddleware(mockRemoteMuster),
//         ]),
//       }),
//       operations: [
//         operation({
//           description: 'WHEN making a query to a list with a name',
//           input: query(ref('remote'), {
//             items: key('items', entries({
//               name: key('name'),
//             })),
//           }),
//           expected: tree({
//             items: array([
//               tree({ name: value('first name') }),
//               tree({ name: value('second name') }),
//               tree({ name: value('third name') }),
//             ]),
//           }),
//           operations: [
//             operation({
//               before() {
//                 jest.clearAllMocks();
//               },
//               description: 'AND a second query is made for list with name and description',
//               input: query(ref('remote'), {
//                 items: key('items', entries({
//                   name: key('name'),
//                   description: key('description'),
//                 })),
//               }),
//               expected: tree({
//                 items: array([
//                   tree({
//                     name: value('first name'),
//                     description: value('first description'),
//                   }),
//                   tree({
//                     name: value('second name'),
//                     description: value('second description'),
//                   }),
//                   tree({
//                     name: value('third name'),
//                     description: value('third description'),
//                   }),
//                 ]),
//               }),
//             }),
//           ],
//         }),
//       ],
//     });
//   });
//
//   describe('Caching a query and re-requesting it after a set', () => {
//     let remoteMuster: Muster;
//     let mockRemoteMuster: jest.Mock<ObservableLike<NodeDefinition>>;
//
//     beforeEach(() => {
//       remoteMuster = muster({
//         name: variable('initial'),
//       });
//       mockRemoteMuster = jest.fn((req) => remoteMuster.resolve(req, { raw: true }));
//     });
//
//     runScenario({
//       description: 'GIVEN a local instance of muster connected to the remote',
//       graph: () => muster({
//         remote: proxy([
//           cacheMiddleware(true),
//           fromStreamMiddleware(mockRemoteMuster),
//         ]),
//       }),
//       operations: [
//         operation({
//           description: 'WHEN making an initial query for the name',
//           input: query(ref('remote'), {
//             name: key('name'),
//           }),
//           expected: tree({
//             name: value('initial'),
//           }),
//           assert() {
//             expect(mockRemoteMuster).toHaveBeenCalledTimes(1);
//             expect(mockRemoteMuster).toHaveBeenCalledWith(combineLatest([
//               query(root(), {
//                 '0:name': key('name'),
//               }),
//             ]));
//           },
//           operations: (subscriber) => [
//             operation({
//               description: 'AND the name gets changed',
//               before() {
//                 jest.clearAllMocks();
//               },
//               input: set(['remote', 'name'], 'updated'),
//               expected: value('updated'),
//               assert() {
//                 expect(mockRemoteMuster).toHaveBeenCalledTimes(1);
//                 expect(mockRemoteMuster).toHaveBeenCalledWith(combineLatest([
//                   set(get(root(), 'name'), 'updated'),
//                 ]));
//                 expect(subscriber().next).toHaveBeenCalledTimes(1);
//                 expect(subscriber().next).toHaveBeenCalledWith(tree({
//                   name: value('updated'),
//                 }));
//               },
//               operations: [
//                 operation({
//                   description: 'AND the name is requested for the second time (first subscription open)',
//                   before() { jest.clearAllMocks(); },
//                   input: query(ref('remote'), {
//                     name: key('name'),
//                   }),
//                   expected: tree({
//                     name: value('updated'),
//                   }),
//                   assert() {
//                     expect(mockRemoteMuster).not.toHaveBeenCalled();
//                   },
//                 }),
//                 operation({
//                   description: 'AND the name is requested for the second time (first subscription closed)',
//                   before() {
//                     jest.clearAllMocks();
//                     subscriber().subscription.unsubscribe();
//                   },
//                   input: query(ref('remote'), {
//                     name: key('name'),
//                   }),
//                   expected: tree({
//                     name: value('updated'),
//                   }),
//                   assert() {
//                     expect(mockRemoteMuster).not.toHaveBeenCalled();
//                   },
//                 }),
//               ],
//             }),
//           ],
//         }),
//       ],
//     });
//   });
//
//   describe('Don`t cache a query that does a call', () => {
//     let mockAction: jest.Mock<void>;
//     let remoteMuster: Muster;
//     let mockRemoteMuster: jest.Mock<ObservableLike<NodeDefinition>>;
//
//     beforeEach(() => {
//       mockAction = jest.fn();
//       remoteMuster = muster({
//         doSomething: action(mockAction),
//       });
//       mockRemoteMuster = jest.fn((req) => remoteMuster.resolve(req, { raw: true }));
//     });
//
//     runScenario({
//       description: 'GIVEN a local instance connected to the remote',
//       graph: () => muster({
//         remote: proxy([
//           cacheMiddleware(true),
//           fromStreamMiddleware(mockRemoteMuster),
//         ]),
//       }),
//       operations: [
//         operation({
//           description: 'WHEN calling a remote action',
//           input: call(['remote', 'doSomething']),
//           expected: value(undefined),
//           assert() {
//             expect(mockAction).toHaveBeenCalledTimes(1);
//           },
//           operations: (subscriber) => [
//             operation({
//               description: 'AND the action is called again (with subscription open)',
//               before() {
//                 jest.clearAllMocks();
//               },
//               input: call(['remote', 'doSomething']),
//               expected: value(undefined),
//               assert() {
//                 expect(mockAction).toHaveBeenCalledTimes(1);
//               },
//             }),
//             operation({
//               description: 'AND the action is called again (with subscription closed)',
//               before() {
//                 jest.clearAllMocks();
//                 subscriber().subscription.unsubscribe();
//               },
//               input: call(['remote', 'doSomething']),
//               expected: value(undefined),
//               assert() {
//                 expect(mockAction).toHaveBeenCalledTimes(1);
//               },
//             }),
//           ],
//         }),
//       ],
//     });
//   });
//
//   describe('Don`t cache a query that does a set', () => {
//     let remoteMuster: Muster;
//     let mockRemoteMuster: jest.Mock<ObservableLike<NodeDefinition>>;
//
//     beforeEach(() => {
//       remoteMuster = muster({
//         name: variable('initial'),
//       });
//       mockRemoteMuster = jest.fn((req) => remoteMuster.resolve(req, { raw: true }));
//     });
//
//     runScenario({
//       description: 'GIVEN a local instance of muster connected to the remote',
//       graph: () => muster({
//         remote: proxy([
//           cacheMiddleware(true),
//           fromStreamMiddleware(mockRemoteMuster),
//         ]),
//       }),
//       operations: [
//         operation({
//           description: 'WHEN the set is called with `updated` value',
//           input: set(['remote', 'name'], 'updated'),
//           expected: value('updated'),
//           assert() {
//             expect(mockRemoteMuster).toHaveBeenCalledTimes(1);
//           },
//           operations: [
//             operation({
//               description: 'AND the set is once more called with `updated` value',
//               before() {
//                 jest.clearAllMocks();
//               },
//               input: set(['remote', 'name'], 'some other'),
//               expected: value('some other'),
//               assert() {
//                 expect(mockRemoteMuster).toHaveBeenCalledTimes(1);
//               }
//             }),
//           ],
//         }),
//       ],
//     });
//   });
//
//   describe('Don`t cache a query that does a combined set and call', () => {
//     let mockAction: jest.Mock<void>;
//     let remoteMuster: Muster;
//     let mockRemoteMuster: jest.Mock<ObservableLike<NodeDefinition>>;
//
//     beforeEach(() => {
//       mockAction = jest.fn();
//       remoteMuster = muster({
//         doSomething: action(mockAction),
//         name: variable('initial'),
//       });
//       mockRemoteMuster = jest.fn((req) => remoteMuster.resolve(req, { raw: true }));
//     });
//
//     runScenario({
//       description: 'GIVEN a local instance of muster connected to the remote',
//       graph: () => muster({
//         remote: proxy([
//           cacheMiddleware(true),
//           fromStreamMiddleware(mockRemoteMuster),
//         ]),
//       }),
//       operations: [
//         operation({
//           description: 'WHEN set and call is done in parallel',
//           input: combineLatest([
//             call(['remote', 'doSomething']),
//             set(['remote', 'name'], 'updated'),
//           ]),
//           expected: array([
//             value(undefined),
//             value('updated'),
//           ]),
//           assert() {
//             expect(mockRemoteMuster).toHaveBeenCalledTimes(1);
//           },
//           operations: [
//             operation({
//               description: 'AND the same set and call is re-requested',
//               before() {
//                 jest.clearAllMocks();
//               },
//               input: combineLatest([
//                 call(['remote', 'doSomething']),
//                 set(['remote', 'name'], 'updated'),
//               ]),
//               expected: array([
//                 value(undefined),
//                 value('updated'),
//               ]),
//               assert() {
//                 expect(mockRemoteMuster).toHaveBeenCalledTimes(1);
//               },
//             }),
//           ],
//         }),
//         operation({
//           description: 'WHEN set and call is done in series',
//           input: series([
//             call(['remote', 'doSomething']),
//             set(['remote', 'name'], 'updated'),
//           ]),
//           expected: value('updated'),
//           assert() {
//             // Expect the remote to be called twice:
//             // - First time with the `call`
//             // - Second time (after completing the `call`) with `set`
//             expect(mockRemoteMuster).toHaveBeenCalledTimes(2);
//           },
//           operations: [
//             operation({
//               description: 'AND the same set and call is re-requested',
//               before() {
//                 jest.clearAllMocks();
//               },
//               input: series([
//                 call(['remote', 'doSomething']),
//                 set(['remote', 'name'], 'updated'),
//               ]),
//               expected: value('updated'),
//               assert() {
//                 expect(mockRemoteMuster).toHaveBeenCalledTimes(2);
//               },
//             }),
//           ],
//         }),
//       ],
//     });
//   });
//
//   describe('Cache only the query part of the combined query', () => {
//     let mockAction: jest.Mock<void>;
//     let remoteMuster: Muster;
//     let mockRemoteMuster: jest.Mock<ObservableLike<NodeDefinition>>;
//
//     beforeEach(() => {
//       mockAction = jest.fn();
//       remoteMuster = muster({
//         name: 'initial',
//         doSomething: action(mockAction),
//       });
//       mockRemoteMuster = jest.fn((req) => remoteMuster.resolve(req, { raw: true }));
//     });
//
//     runScenario({
//       description: 'GIVEN a local muster instance connected to the remote',
//       graph: () => muster({
//         remote: proxy([
//           cacheMiddleware(true),
//           fromStreamMiddleware(mockRemoteMuster),
//         ]),
//       }),
//       operations: [
//         operation({
//           description: 'WHEN the query is made to get and call at the same time',
//           input: combineLatest([
//             query(ref('remote'), {
//               name: key('name'),
//             }),
//             call(['remote', 'doSomething']),
//           ]),
//           expected: array([
//             tree({ name: value('initial') }),
//             value(undefined),
//           ]),
//           assert() {
//             expect(mockRemoteMuster).toHaveBeenCalledTimes(1);
//             expect(mockRemoteMuster).toHaveBeenCalledWith(combineLatest([
//               call(ref('doSomething')),
//               query(root(), {
//                 '0:name': key('name'),
//               }),
//             ]));
//             expect(mockAction).toHaveBeenCalledTimes(1);
//           },
//           operations: (subscriber) => [
//             operation({
//               description: 'AND the query is repeated (with subscription open)',
//               before() {
//                 jest.clearAllMocks();
//               },
//               input: combineLatest([
//                 query(ref('remote'), {
//                   name: key('name'),
//                 }),
//                 call(['remote', 'doSomething']),
//               ]),
//               expected: array([
//                 tree({ name: value('initial') }),
//                 value(undefined),
//               ]),
//               assert() {
//                 expect(mockRemoteMuster).toHaveBeenCalledTimes(1);
//                 expect(mockRemoteMuster).toHaveBeenCalledWith(combineLatest([
//                   call(ref('doSomething')),
//                 ]));
//                 expect(mockAction).toHaveBeenCalledTimes(1);
//               },
//             }),
//             operation({
//               description: 'AND the query is repeated (with subscription closed)',
//               before() {
//                 jest.clearAllMocks();
//                 subscriber().subscription.unsubscribe();
//               },
//               input: combineLatest([
//                 query(ref('remote'), {
//                   name: key('name'),
//                 }),
//                 call(['remote', 'doSomething']),
//               ]),
//               expected: array([
//                 tree({ name: value('initial') }),
//                 value(undefined),
//               ]),
//               assert() {
//                 expect(mockRemoteMuster).toHaveBeenCalledTimes(1);
//                 expect(mockRemoteMuster).toHaveBeenCalledWith(combineLatest([
//                   call(ref('doSomething')),
//                   tree({}),
//                 ]));
//                 expect(mockAction).toHaveBeenCalledTimes(1);
//               },
//             }),
//           ],
//         }),
//       ],
//     });
//   });
//
//   describe('Cache a simple query, reset the exact path, re-request', () => {
//     let remoteMuster: Muster;
//     let mockRemoteMuster: jest.Mock<ObservableLike<NodeDefinition>>;
//
//     beforeEach(() => {
//       remoteMuster = muster({
//         name: 'name value',
//       });
//       mockRemoteMuster = jest.fn((req) => remoteMuster.resolve(req, { raw: true }));
//     });
//
//     runScenario({
//       description: 'GIVEN a local instance of muster connected to the remote',
//       graph: () => muster({
//         remote: proxy([
//           cacheMiddleware(true),
//           fromStreamMiddleware(mockRemoteMuster),
//         ]),
//       }),
//       operations: [
//         operation({
//           description: 'WHEN the name gets requested',
//           input: query(ref('remote'), {
//             name: key('name'),
//           }),
//           expected: tree({
//             name: value('name value'),
//           }),
//           assert() {
//             expect(mockRemoteMuster).toHaveBeenCalledTimes(1);
//           },
//           operations: (subscriber) => [
//             operation({
//               description: 'AND the name gets reset',
//               before() {
//                 jest.clearAllMocks();
//               },
//               input: dispatch(resetCacheForPaths([
//                 { path: [value('name')] },
//               ])),
//               expected: ok(),
//               assert() {
//                 expect(subscriber().next).not.toHaveBeenCalled();
//                 expect(mockRemoteMuster).not.toHaveBeenCalled();
//               },
//               operations: [
//                 operation({
//                   description: 'AND the name gets re-requested (with subscription open)',
//                   before() {
//                     jest.clearAllMocks();
//                   },
//                   input: query(ref('remote'), {
//                     name: key('name'),
//                   }),
//                   expected: tree({
//                     name: value('name value'),
//                   }),
//                   assert() {
//                     expect(mockRemoteMuster).toHaveBeenCalledTimes(0);
//                   },
//                 }),
//                 operation({
//                   description: 'AND the name gets re-requested (with subscription closed)',
//                   before() {
//                     jest.clearAllMocks();
//                     subscriber().subscription.unsubscribe();
//                   },
//                   input: query(ref('remote'), {
//                     name: key('name'),
//                   }),
//                   expected: tree({
//                     name: value('name value'),
//                   }),
//                   assert() {
//                     expect(mockRemoteMuster).toHaveBeenCalledTimes(1);
//                   },
//                 }),
//               ],
//             }),
//           ],
//         }),
//       ],
//     });
//   });
//
//   describe('Cache a simple query, reset the exact path, invalidate remote', () => {
//     let numberStream: BehaviorSubject<number>;
//     let remoteMuster: Muster;
//     let mockRemoteMuster: jest.Mock<ObservableLike<NodeDefinition>>;
//
//     beforeEach(() => {
//       numberStream = new BehaviorSubject<number>(0);
//       remoteMuster = muster({
//         number: fromStream(numberStream),
//       });
//       mockRemoteMuster = jest.fn((req) => remoteMuster.resolve(req, { raw: true }));
//     });
//
//     runScenario({
//       description: 'GIVEN a local instance of muster connected to the remote',
//       graph: () => muster({
//         remote: proxy([
//           cacheMiddleware(true),
//           fromStreamMiddleware(mockRemoteMuster),
//         ]),
//       }),
//       operations: [
//         operation({
//           description: 'WHEN the number gets requested',
//           input: query(ref('remote'), {
//             number: key('number'),
//           }),
//           expected: tree({
//             number: value(0),
//           }),
//           assert() {
//             expect(mockRemoteMuster).toHaveBeenCalledTimes(1);
//           },
//           operations: (subscriber) => [
//             operation({
//               description: 'AND the number gets re-requested (with subscription open)',
//               before() {
//                 jest.clearAllMocks();
//               },
//               input: query(ref('remote'), {
//                 number: key('number'),
//               }),
//               expected: tree({
//                 number: value(0),
//               }),
//               assert() {
//                 expect(mockRemoteMuster).not.toHaveBeenCalled();
//               },
//             }),
//             operation({
//               description: 'AND the remote path gets reset and remote invalidated',
//               before() {
//                 jest.clearAllMocks();
//                 numberStream.next(1);
//               },
//               input: series([
//                 dispatch(resetCacheForPaths([
//                   { path: [value('number')] },
//                 ])),
//                 invalidate(ref('remote')),
//               ]),
//               assert() {
//                 expect(mockRemoteMuster).toHaveBeenCalledTimes(1);
//                 expect(subscriber().next).toHaveBeenCalledTimes(1);
//                 expect(subscriber().next).toHaveBeenCalledWith(tree({
//                   number: value(1),
//                 }));
//               },
//             }),
//           ],
//         }),
//       ],
//     });
//   });
// });
