import { Observable, ObservableLike, Observer } from '@dws/muster-observable';
const xhr = require('xhr');
import { Emitter } from '../../../utils/emitter';
import { error, ErrorNodeDefinition } from '../../graph/error';

export interface HttpRequestConfiguration {
  body: string;
  headers: { [key: string]: string };
  numberOfRetries?: number;
  retryDelay?: number;
  requestTimeout?: number;
  url: string;
  withCredentials: boolean;
}

interface XhrResponse {
  body: any;
  statusCode: number;
  method: String;
  headers: any;
  url: string;
}

type XhrResult = { hasTimedOut: true } | { hasTimedOut: false; body: string | ErrorNodeDefinition };

export type Callback<T> = (err: any, response: T, body: any) => void;

export function doHttpRequest(
  config: HttpRequestConfiguration,
): ObservableLike<string | ErrorNodeDefinition> {
  return new Observable((observer: Observer<string | ErrorNodeDefinition>) => {
    let cancelled = false;
    const abortEmitter = new Emitter<boolean>();
    // This returns promise but we ignore it...
    startRequestRetryLoop(config, observer, abortEmitter);
    return () => {
      if (cancelled) return;
      cancelled = true;
      abortEmitter.emit(true);
    };
  });
}

async function startRequestRetryLoop(
  config: HttpRequestConfiguration,
  observer: Observer<string | ErrorNodeDefinition>,
  abortEmitter: Emitter<boolean>,
) {
  let remainingRetries = config.numberOfRetries || 0;
  do {
    const response = await doSingleHttpRequest(config, abortEmitter);
    if (!response.hasTimedOut) {
      observer.next(response.body);
      return;
    }
    remainingRetries--; // tslint:disable-line:no-increment-decrement
    if (remainingRetries > 0 && config.retryDelay) {
      await new Promise((res) => setTimeout(res, config.retryDelay));
    }
  } while (remainingRetries > 0);
  observer.next(error(`Could not complete the HTTP request: A request has timed out.`));
}

function doSingleHttpRequest(
  config: HttpRequestConfiguration,
  abortEmitter: Emitter<boolean>,
): Promise<XhrResult> {
  let resolve: (res: XhrResult) => void;
  const resultPromise = new Promise<XhrResult>((res) => (resolve = res));
  let disposeAbortListener: (() => void) | undefined;
  let isAborted = false;
  let isCompleted = false;
  const request = startRequest(config, (err: any, res: XhrResponse, body: any) => {
    if (isAborted) return;
    isCompleted = true;
    disposeAbortListener && disposeAbortListener();
    if (res.statusCode === 0) {
      resolve({ hasTimedOut: true });
      return;
    }
    resolve({ hasTimedOut: false, body: processResponse(config, err, res, body) });
  });
  if (!isCompleted) {
    disposeAbortListener = abortEmitter.listen(() => {
      if (isCompleted) return;
      isAborted = true;
      disposeAbortListener && disposeAbortListener();
      request.abort();
      resolve({ hasTimedOut: false, body: error('The request was aborted.') });
    });
    if (isAborted) {
      disposeAbortListener();
    }
  }
  return resultPromise;
}

function startRequest(
  config: HttpRequestConfiguration,
  callback: Callback<XhrResponse>,
): XMLHttpRequest {
  return xhr(
    {
      body: config.body,
      headers: config.headers,
      method: 'POST',
      timeout: config.requestTimeout,
      url: config.url,
      useXDR: false,
      withCredentials: config.withCredentials,
    },
    callback,
  );
}

function processResponse(
  config: HttpRequestConfiguration,
  err: any,
  res: XhrResponse,
  body: string,
): string | ErrorNodeDefinition {
  if (err) return error('Network error');
  if (res.statusCode < 200 || res.statusCode > 299) return remoteError(body, res);
  if (!body) return remoteError('Invalid remote server response', res);
  return body;
}

function remoteError(message: string, response: XhrResponse): ErrorNodeDefinition {
  return error(message, {
    data: {
      url: response.url,
      statusCode: response.statusCode,
    },
  });
}
