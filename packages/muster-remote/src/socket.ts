import WebSocket from 'isomorphic-ws';
import defaults from 'lodash/defaults';
import noop from 'lodash/noop';

/*
  error events:
    error
    navigator.offline / onLine
      window.addEventListener('online',  updateOnlineStatus);
    close => code !== 1000
 */
/**
 * Options for creating a new [[ReconnectingWebSocket]]
 */
export interface WebSocketOptions {
  /**
   * How many times to attempt to reconnect before abandoning. `null` will never give up.
   * @default null
   */
  numberOfRetries: number | null;
  /**
   * How long in ms to wait between retries. NB will be scaled by `reconnectFactor`
   * @default 500
   */
  retryDelay: number;
  /**
   * The amount of additional delay to apply on each retry attempt.
   * @default 1.5
   */
  reconnectFactor: number;
  /**
   * How long in ms to make each connection request for until timeout
   * @default 10000
   */
  requestTimeout: number;
  /**
   * The maximum wait-time in ms between reconnection attempts, irrespective of attempt number and factor scaling
   * @default 1000 * 60 * 10
   */
  maxTimeoutDelay: number;
  /**
   * Whether to log activities to the console
   * @default false
   */
  log: boolean;
  /**
   * Whether to open the WebSocket immediately on construction
   * @default false
   */
  autoStart: boolean;
}

const defaultOptions: WebSocketOptions = {
  numberOfRetries: null,
  retryDelay: 500,
  reconnectFactor: 1.5,
  requestTimeout: 10000,
  maxTimeoutDelay: 1000 * 60 * 10,
  log: false,
  autoStart: false,
};

interface WebSocketHandlers {
  open: Array<() => void>;
  message: Array<(message: any) => void>;
  error: Array<(error: Error) => void>;
  close: Array<
    (event: { wasClean: boolean; code: number; reason: string; target: WebSocket }) => void
  >;

  [method: string]: Array<Function>;
}

const defaultHandlers: WebSocketHandlers = {
  open: [],
  message: [],
  error: [],
  close: [],
};

/*
  Heavily inspired by https://github.com/joewalnes/reconnecting-websocket
 */
/**
 * An abstraction over isomorphic websocket to encapsulate auto-reconnect
 */
export default class ReconnectingWebSocket {
  private socket: WebSocket | null;
  private state: number;
  private wasForceClosed: boolean;
  private isTimedOut: boolean;
  private options: WebSocketOptions;
  private handlers: WebSocketHandlers = defaultHandlers;
  private readonly log: Function;

  get readyState() {
    return this.state;
  }

  private static deserialise(e: { data: any; type: string; target: WebSocket }) {
    return JSON.parse(e.data);
  }

  private static serialise(data: any): string {
    return JSON.stringify(data);
  }

  /**
   * Create a new ReconnectingWebSocket
   * @param url - target url of the WebSocket server
   * @param options - configuration options
   */
  constructor(private url: string, options: Partial<WebSocketOptions>) {
    this.options = defaults(options, defaultOptions);
    this.log = this.options.log ? console.debug : noop;
    if (this.options.autoStart) {
      this.open();
    }
  }

  private fireHandler(method: string, ...args: Array<any>) {
    this.log('ReconnectingWebSocket', 'fire-event', method, args);
    this.handlers[method].forEach((handler: Function) => handler(...args));
  }

  /**
   * Add an event listener to the socket
   * @param method - 'message' | 'close' | 'error' | 'open'
   * @param cb - callback
   */
  addEventListener(method: 'message', cb?: (message: any) => void): void;
  addEventListener(
    method: 'close',
    cb?: (
      event: {
        wasClean: boolean;
        code: number;
        reason: string;
        target: WebSocket;
      },
    ) => void,
  ): void;
  addEventListener(method: 'error', cb?: (error: Error) => void): void;
  addEventListener(method: 'open', cb?: () => void): void;
  addEventListener(method: string, listener: () => void): void {
    this.handlers[method].push(listener);
  }

  /**
   * Remove an event listener
   * @param method - 'message' | 'close' | 'error' | 'open'
   * @param cb - callback
   */
  removeEventListener(method: 'message', cb?: (message: any) => void): void;
  removeEventListener(
    method: 'close',
    cb?: (
      event: {
        wasClean: boolean;
        code: number;
        reason: string;
        target: WebSocket;
      },
    ) => void,
  ): void;
  removeEventListener(method: 'error', cb?: (error: Error) => void): void;
  removeEventListener(method: 'open', cb?: () => void): void;
  removeEventListener(method: string, listener: () => void): void {
    const handlerIndex = this.handlers[method].indexOf(listener, 1);
    if (handlerIndex > -1) {
      this.handlers[method].splice(handlerIndex);
    }
  }

  /**
   * Remove all event listeners from a Socket
   */
  removeAllEventListeners() {
    this.handlers = defaultHandlers;
  }

  /**
   * Connect the WebSocket with its target server
   * @param [reconnectAttempt] - attempt number (if reconnecting)
   */
  open(reconnectAttempt?: number) {
    if (
      reconnectAttempt &&
      this.options.numberOfRetries &&
      reconnectAttempt > this.options.numberOfRetries
    ) {
      this.log('ReconnectingWebSocket', 'max-retries-expire', reconnectAttempt);
      return;
    }
    this.state = WebSocket.CONNECTING;
    this.socket = new WebSocket(this.url);

    this.log('ReconnectingWebSocket', 'connecting', this.url, reconnectAttempt);
    const socketClosure = this.socket;
    const timeoutTimeout = setTimeout(() => {
      this.log('ReconnectingWebSocket', 'timeout', this.url);
      this.isTimedOut = true;
      socketClosure.close();
      this.isTimedOut = false;
    }, this.options.requestTimeout);

    this.addListeners(timeoutTimeout, reconnectAttempt);
  }

  private addListeners(timeoutTimeout: any, reconnectAttempt?: number) {
    if (!this.socket) return;

    this.socket.addEventListener('open', () => {
      clearTimeout(timeoutTimeout);
      this.log('ReconnectingWebSocket', 'open');
      this.state = WebSocket.OPEN;
      this.fireHandler('open');
    });

    this.socket.addEventListener('close', (event) => {
      clearTimeout(timeoutTimeout);
      this.socket = null;
      if (this.wasForceClosed) {
        this.state = WebSocket.CLOSED;
        this.fireHandler('close', event);
      } else {
        this.reconnect(event, reconnectAttempt);
      }
    });

    this.socket.addEventListener('message', (event) => {
      try {
        this.log('ReconnectingWebSocket', 'message', event.data);
        const message = ReconnectingWebSocket.deserialise(event);
        this.fireHandler('message', message);
      } catch (e) {
        this.fireHandler('error', e);
      }
    });

    this.socket.addEventListener('error', (event) => {
      this.log('ReconnectingWebSocket', 'error', event);
      this.fireHandler('error', new Error(event.error));
    });
  }

  private reconnect(event: any, reconnectAttempt: number = 0) {
    this.state = WebSocket.CONNECTING;
    if (!reconnectAttempt && !this.isTimedOut) {
      this.log('ReconnectingWebSocket', 'connection-dropped', this.url);
      this.fireHandler('close', event);
    }

    const retryDelay = this.options.retryDelay;
    const factor = this.options.reconnectFactor;
    const nextAttempt = reconnectAttempt + 1;
    const reconnectTimeout = retryDelay * Math.pow(factor, nextAttempt);
    this.log('ReconnectingWebSocket', 'reconnecting-in', reconnectTimeout);
    setTimeout(() => {
      this.log('ReconnectingWebSocket', 'reconnecting', nextAttempt);
      this.open(nextAttempt);
    }, Math.min(reconnectTimeout, this.options.maxTimeoutDelay));
  }

  /**
   * Send data to the server. Data will be serialised automatically.
   * @param data - the data to send to the server
   */
  send(data: object) {
    if (this.socket && this.readyState === WebSocket.OPEN) {
      this.log('ReconnectingWebSocket', 'send', data);
      try {
        return this.socket.send(ReconnectingWebSocket.serialise(data));
      } catch (e) {
        this.fireHandler('error', e);
      }
    }
  }

  /**
   * Close the websocket
   * @param [code=1000] - the error code to send to the server
   * @param [reason] - the error reason to send to the server
   */
  close(code: number = 1000, reason?: string) {
    this.log('ReconnectingWebSocket', 'force-close', code, reason);
    this.wasForceClosed = true;
    if (this.socket) {
      this.socket.close(code, reason);
    }
  }

  /**
   * Close and re-open the WebSocket connection
   */
  refresh() {
    if (this.socket) {
      this.log('ReconnectingWebSocket', 'refresh');
      this.socket.close();
    }
  }
}
