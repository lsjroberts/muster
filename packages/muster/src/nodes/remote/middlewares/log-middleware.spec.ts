import { ObservableLike } from '@dws/muster-observable';
import muster, { fromStreamMiddleware, Muster, NodeDefinition, proxy, ref } from '../../..';
import { operation, runScenario } from '../../../test';
import { logMiddleware } from './log-middleware';

describe('logMiddleware()', () => {
  let mockRemoteMuster: Muster;
  let mockRemoteResolve: jest.Mock<ObservableLike<NodeDefinition>>;
  let mockSink: jest.Mock<void>;

  beforeEach(() => {
    mockRemoteResolve = jest.fn((req) => mockRemoteMuster.resolve(req, { raw: true }));
    mockSink = jest.fn();
  });

  runScenario({
    description: 'GIVEN a proxy node with a logMiddleware before the fromStreamMiddleware',
    before() {
      mockRemoteMuster = muster({
        name: 'Bob',
      });
    },
    graph: () =>
      muster({
        remote: proxy([logMiddleware({ sink: mockSink }), fromStreamMiddleware(mockRemoteResolve)]),
      }),
    operations: [
      operation({
        description: 'WHEN the remote name is requested',
        input: ref('remote', 'name'),
        assert() {
          expect(mockSink).toHaveBeenCalledTimes(2);
        },
      }),
    ],
  });
});
