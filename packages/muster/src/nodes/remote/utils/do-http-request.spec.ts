import { error, getMusterNodeTypesMap, serialize, value } from '../../..';
import { Callback, doHttpRequest } from './do-http-request';

interface MockResponse {
  url: string;
  statusCode: number;
}

jest.mock('xhr', () => {
  const mockXhr = jest.fn();
  const mockAbort = jest.fn();
  const xhr = (options: any, callback: Callback<Response>) => {
    mockXhr(options, callback);
    return {
      abort: mockAbort,
    };
  };
  return Object.assign(xhr, {
    mockResponse(err: any, response: MockResponse, data: any) {
      mockXhr.mockImplementation((options: any, callback: Callback<Response>) => {
        callback(err, response as any, data);
      });
    },
    mockXhr,
    mockAbort,
  });
});

const xhr = require('xhr');
const mockResponse = (xhr as any).mockResponse;
const mockXhr = (xhr as any).mockXhr;

declare const global: any;

describe('doHttpRequest()', () => {
  const testConfig = {
    body: '',
    headers: {},
    url: 'test',
    numberOfRetries: 2,
    nodeTypes: getMusterNodeTypesMap(),
    retryDelay: 100,
    requestTimeout: 1000,
    withCredentials: false,
  };
  let mockSetTimeout: jest.Mock<void>;
  const setTimeout = global.setTimeout;

  beforeEach(() => {
    jest.clearAllMocks();
    mockSetTimeout = jest.fn((callback) => callback());
    global.setTimeout = mockSetTimeout;
  });

  afterEach(() => {
    global.setTimeout = setTimeout;
  });

  describe('WHEN the server responds with a valid JSON', () => {
    beforeEach(() => {
      mockResponse(undefined, { url: 'test', statusCode: 200 }, serialize(value('test')));
    });

    it('SHOULD return correct value', (done) => {
      doHttpRequest(testConfig).subscribe((result) => {
        expect(result).toEqual(JSON.stringify({ $type: 'value', data: { value: 'test' } }));
        expect(mockXhr).toHaveBeenCalledTimes(1);
        done();
      });
    });
  });

  describe('WHEN the server responds with an invalid JSON', () => {
    beforeEach(() => {
      mockResponse(undefined, { url: 'test', statusCode: 200 }, '{ "foo": "bar" }');
    });

    it('SHOULD return the correct value', (done) => {
      doHttpRequest(testConfig).subscribe((result) => {
        expect(result).toEqual('{ "foo": "bar" }');
        expect(mockXhr).toHaveBeenCalledTimes(1);
        done();
      });
    });
  });

  describe('WHEN the server responds with an error', () => {
    beforeEach(() => {
      mockResponse('Some error', { url: 'test', statusCode: 200 }, '{ "foo": "bar" }');
    });

    it('SHOULD return an error', (done) => {
      doHttpRequest(testConfig).subscribe((result) => {
        expect(result).toEqual(error('Network error'));
        expect(mockXhr).toHaveBeenCalledTimes(1);
        done();
      });
    });
  });

  describe('WHEN the request times out', () => {
    beforeEach(() => {
      mockResponse(undefined, { url: 'test', statusCode: 0 }, '');
    });

    it('SHOULD retry the request 2 times', (done) => {
      doHttpRequest(testConfig).subscribe((result) => {
        expect(result).toEqual(
          error('Could not complete the HTTP request: A request has timed out.'),
        );
        expect(mockXhr).toHaveBeenCalledTimes(2);
        expect(mockSetTimeout).toHaveBeenCalledTimes(1);
        done();
      });
    });
  });
});
