import muster, {
  computed,
  error,
  ErrorNodeDefinition,
  fields,
  fromStreamMiddleware,
  key,
  Muster,
  NodeDefinition,
  proxy,
  query,
  ref,
  root,
  transformResponseMiddleware,
} from '../../..';
import { operation, runScenario } from '../../../test';
import { withErrorPath } from '../../graph/error';
import { handleErrors } from './handle-errors';

describe('handleErrors', () => {
  describe('GIVEN a remote instance of muster', () => {
    let remoteMuster: Muster;
    beforeEach(() => {
      remoteMuster = muster({
        someValue: 'initial value',
        someError: error('Test error'),
        someErrorRef: ref('someError'),
        nested: {
          someError: error('Test nested error'),
        },
      });
    });

    runScenario(() => {
      let errorCallback: jest.Mock<NodeDefinition | undefined>;
      return {
        description: 'AND a proxy node with an error handler callback that returns undefined',
        before() {
          errorCallback = jest.fn((e: ErrorNodeDefinition) => undefined);
        },
        graph: () =>
          muster({
            proxy: proxy([
              transformResponseMiddleware(handleErrors(errorCallback)),
              fromStreamMiddleware((req) => remoteMuster.resolve(req, { raw: true })),
            ]),
          }),
        operations: [
          operation({
            description: 'AND a ref points to the remote error',
            before() {
              jest.clearAllMocks();
            },
            input: ref('proxy', 'someError'),
            expected: withErrorPath(
              error(
                [
                  'Invalid handleErrors transform return value',
                  ' Expected:',
                  '  NodeDefinition',
                  ' Received:',
                  '  undefined',
                ].join('\n'),
              ),
              { path: ['proxy', 'someError'] },
            ),
          }),
          operation({
            description: 'AND a ref points to the nested remote error',
            input: ref('proxy', 'nested', 'someError'),
            expected: withErrorPath(
              error(
                [
                  'Invalid handleErrors transform return value',
                  ' Expected:',
                  '  NodeDefinition',
                  ' Received:',
                  '  undefined',
                ].join('\n'),
              ),
              { path: ['proxy', 'nested', 'someError'] },
            ),
          }),
        ],
      };
    });

    runScenario(() => {
      let errorCallback: jest.Mock<NodeDefinition | undefined>;
      return {
        description: 'AND a proxy node with an error handler callback that remaps the error',
        before() {
          errorCallback = jest.fn((e: ErrorNodeDefinition) =>
            error(`ERROR: ${e.properties.error.message}`),
          );
        },
        graph: () =>
          muster({
            proxy: proxy([
              transformResponseMiddleware(handleErrors(errorCallback)),
              fromStreamMiddleware((req) => remoteMuster.resolve(req, { raw: true })),
            ]),
          }),
        operations: [
          operation({
            description: 'AND a ref points to the remote error',
            before() {
              jest.clearAllMocks();
            },
            input: ref('proxy', 'someError'),
            expected: withErrorPath(error('ERROR: Test error'), { path: ['proxy', 'someError'] }),
          }),
          operation({
            description: 'AND a query is made to get the remote error',
            before() {
              jest.clearAllMocks();
            },
            input: query(
              root(),
              fields({
                proxy: key(
                  'proxy',
                  fields({
                    someError: key('someError'),
                  }),
                ),
              }),
            ),
            expected: withErrorPath(error('ERROR: Test error'), { path: ['proxy', 'someError'] }),
          }),
          operation({
            description: 'AND a query is made to get the remote redirected error',
            before() {
              jest.clearAllMocks();
            },
            input: query(
              root(),
              fields({
                proxy: key(
                  'proxy',
                  fields({
                    someErrorRef: key('someErrorRef'),
                  }),
                ),
              }),
            ),
            expected: withErrorPath(error('ERROR: Test error'), {
              path: ['proxy', 'someErrorRef'],
            }),
          }),
        ],
      };
    });

    runScenario(() => {
      let errorCallback: jest.Mock<NodeDefinition | undefined>;
      return {
        description: 'AND a proxy node with a nested error handler callback that remaps the error',
        before() {
          errorCallback = jest.fn((e: ErrorNodeDefinition) =>
            error(`ERROR: ${e.properties.error.message}`),
          );
        },
        graph: () =>
          muster({
            proxy: proxy([
              transformResponseMiddleware(handleErrors(errorCallback)),
              fromStreamMiddleware((req) => remoteMuster.resolve(req, { raw: true })),
            ]),
          }),
        operations: [
          operation({
            description: 'AND a ref points to the remote error',
            before() {
              jest.clearAllMocks();
            },
            input: ref('proxy', 'nested', 'someError'),
            expected: withErrorPath(error('ERROR: Test nested error'), {
              path: ['proxy', 'nested', 'someError'],
            }),
          }),
          operation({
            description: 'AND a query is made to get the remote error',
            before() {
              jest.clearAllMocks();
            },
            input: query(
              root(),
              fields({
                proxy: key(
                  'proxy',
                  fields({
                    nested: fields({
                      someError: key('someError'),
                    }),
                  }),
                ),
              }),
            ),
            expected: withErrorPath(error('ERROR: Test nested error'), {
              path: ['proxy', 'nested', 'someError'],
            }),
          }),
        ],
      };
    });

    runScenario(() => {
      let errorCallback: jest.Mock<NodeDefinition | undefined>;
      return {
        description: 'AND a proxy node with an error handler callback that remaps a computed error',
        before() {
          errorCallback = jest.fn((e: ErrorNodeDefinition) =>
            computed([e.properties.error.message], (message) => error(`ERROR: ${message}`)),
          );
        },
        graph: () =>
          muster({
            errorHandler: transformResponseMiddleware(handleErrors(errorCallback)),
            proxy: proxy([
              ref('errorHandler'),
              fromStreamMiddleware((req) => remoteMuster.resolve(req, { raw: true })),
            ]),
          }),
        operations: [
          operation({
            description: 'AND a ref points to the remote error',
            before() {
              jest.clearAllMocks();
            },
            input: ref('proxy', 'someError'),
            expected: withErrorPath(error('ERROR: Test error'), { path: ['proxy', 'someError'] }),
          }),
          operation({
            description: 'AND a query is made to get the remote error',
            before() {
              jest.clearAllMocks();
            },
            input: query(
              root(),
              fields({
                proxy: key(
                  'proxy',
                  fields({
                    someError: key('someError'),
                  }),
                ),
              }),
            ),
            expected: withErrorPath(error('ERROR: Test error'), { path: ['proxy', 'someError'] }),
          }),
          operation({
            description: 'AND a query is made to get the remote redirected error',
            before() {
              jest.clearAllMocks();
            },
            input: query(
              root(),
              fields({
                proxy: key(
                  'proxy',
                  fields({
                    someErrorRef: key('someErrorRef'),
                  }),
                ),
              }),
            ),
            expected: withErrorPath(error('ERROR: Test error'), {
              path: ['proxy', 'someErrorRef'],
            }),
          }),
        ],
      };
    });
  });

  describe('GIVEN an external Muster instance containing a single root path', () => {
    let remoteMuster: Muster;
    beforeEach(() => {
      remoteMuster = muster(error('error:foo'));
    });

    runScenario(() => {
      let errorCallback: jest.Mock<NodeDefinition>;
      return {
        description: 'GIVEN a proxy node that relays queries to the external Muster instance',
        before: () => {
          errorCallback = jest.fn<ErrorNodeDefinition>((e: ErrorNodeDefinition) =>
            error(`ERROR: ${e.properties.error.message}`),
          );
        },
        graph: () =>
          muster({
            remote: proxy([
              transformResponseMiddleware(handleErrors(errorCallback)),
              fromStreamMiddleware((value: NodeDefinition) =>
                remoteMuster.resolve(value, { raw: true }),
              ),
            ]),
          }),
        operations: [
          operation({
            description: 'AND the remote root is requested',
            input: ref('remote'),
            expected: withErrorPath(error('ERROR: error:foo'), { path: ['remote'] }),
          }),
        ],
      };
    });
  });
});
