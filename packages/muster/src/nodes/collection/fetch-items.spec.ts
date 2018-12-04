import { ObservableLike } from '@dws/muster-observable';
import muster, {
  applyTransforms,
  entries,
  fetchItems,
  filter,
  fromStreamMiddleware,
  get,
  includes,
  key,
  map,
  Muster,
  NodeDefinition,
  proxy,
  query,
  ref,
  root,
  tree,
  value,
} from '../..';
import { operation, runScenario } from '../../test';

describe('fetchItems()', () => {
  describe('GIVEN a remote muster instance containing a collection', () => {
    let remoteMuster: Muster;
    let mockRemoteResolver: jest.Mock<ObservableLike<NodeDefinition>>;

    runScenario({
      description: 'AND the local collection has a map transform',
      before() {
        remoteMuster = muster({
          users: [{ firstName: 'Bob' }, { firstName: 'Anna' }, { firstName: 'Jasmine' }],
        });
        mockRemoteResolver = jest.fn((req) => remoteMuster.resolve(req, { raw: true }));
      },
      graph: () =>
        muster({
          remote: proxy([fromStreamMiddleware(mockRemoteResolver)]),
          users: applyTransforms(fetchItems(ref('remote', 'users')), [
            map((user: NodeDefinition) =>
              tree({
                name: get(user, 'firstName'),
              }),
            ),
          ]),
        }),
      operations: [
        operation({
          description: 'WHEN the query for users is made',
          input: query(root(), {
            users: key(
              'users',
              entries({
                name: key('name'),
              }),
            ),
          }),
          expected: value({
            users: [{ name: 'Bob' }, { name: 'Anna' }, { name: 'Jasmine' }],
          }),
        }),
      ],
    });
  });

  describe('GIVEN a remote muster instance containing a collection', () => {
    let remoteMuster: Muster;
    let mockRemoteResolver: jest.Mock<ObservableLike<NodeDefinition>>;

    runScenario({
      description: 'AND the local collection has a filter transform',
      before() {
        remoteMuster = muster({
          users: [{ firstName: 'Bob' }, { firstName: 'Anna' }, { firstName: 'Jasmine' }],
        });
        mockRemoteResolver = jest.fn((req) => remoteMuster.resolve(req, { raw: true }));
      },
      graph: () =>
        muster({
          remote: proxy([fromStreamMiddleware(mockRemoteResolver)]),
          users: applyTransforms(fetchItems(ref('remote', 'users')), [
            filter((user: NodeDefinition) => includes('n', get(user, 'firstName'))),
          ]),
        }),
      operations: [
        operation({
          description: 'WHEN the query for users is made',
          input: query(root(), {
            users: key(
              'users',
              entries({
                firstName: key('firstName'),
              }),
            ),
          }),
          expected: value({
            users: [{ firstName: 'Anna' }, { firstName: 'Jasmine' }],
          }),
        }),
      ],
    });
  });

  describe('GIVEN a remote muster instance containing a collection', () => {
    let remoteMuster: Muster;
    let mockRemoteResolver: jest.Mock<ObservableLike<NodeDefinition>>;

    runScenario({
      description: 'AND the local collection has a map and then a filter transform',
      before() {
        remoteMuster = muster({
          users: [{ firstName: 'Bob' }, { firstName: 'Anna' }, { firstName: 'Jasmine' }],
        });
        mockRemoteResolver = jest.fn((req) => remoteMuster.resolve(req, { raw: true }));
      },
      graph: () =>
        muster({
          remote: proxy([fromStreamMiddleware(mockRemoteResolver)]),
          users: applyTransforms(fetchItems(ref('remote', 'users')), [
            map((user: NodeDefinition) =>
              tree({
                name: get(user, 'firstName'),
              }),
            ),
            filter((user: NodeDefinition) => includes('n', get(user, 'name'))),
          ]),
        }),
      operations: [
        operation({
          description: 'WHEN the query for users is made',
          input: query(root(), {
            users: key(
              'users',
              entries({
                name: key('name'),
              }),
            ),
          }),
          expected: value({
            users: [{ name: 'Anna' }, { name: 'Jasmine' }],
          }),
        }),
      ],
    });
  });

  describe('GIVEN a remote muster instance containing a collection', () => {
    let remoteMuster: Muster;
    let mockRemoteResolver: jest.Mock<ObservableLike<NodeDefinition>>;

    runScenario({
      description: 'AND the local collection has a filter and then a map transform',
      before() {
        remoteMuster = muster({
          users: [{ firstName: 'Bob' }, { firstName: 'Anna' }, { firstName: 'Jasmine' }],
        });
        mockRemoteResolver = jest.fn((req) => remoteMuster.resolve(req, { raw: true }));
      },
      graph: () =>
        muster({
          remote: proxy([fromStreamMiddleware(mockRemoteResolver)]),
          users: applyTransforms(fetchItems(ref('remote', 'users')), [
            filter((user: NodeDefinition) => includes('n', get(user, 'firstName'))),
            map((user: NodeDefinition) =>
              tree({
                name: get(user, 'firstName'),
              }),
            ),
          ]),
        }),
      operations: [
        operation({
          description: 'WHEN the query for users is made',
          input: query(root(), {
            users: key(
              'users',
              entries({
                name: key('name'),
              }),
            ),
          }),
          expected: value({
            users: [{ name: 'Anna' }, { name: 'Jasmine' }],
          }),
        }),
      ],
    });
  });
});
