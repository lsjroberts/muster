import { FLUSH, TRANSACTION_END, TRANSACTION_START } from '../events';
import { MusterEvent, MusterEventSource, SCOPE, Scope } from '../types/graph';
import createStore from './create-store';
import { Emitter, flatMap } from './emitter';

let uid = 0;

export function createScope(options?: { debug?: boolean }): Scope {
  const globalEvents = createEventSource();
  return {
    [SCOPE]: true,
    // tslint:disable-next-line:no-increment-decrement
    id: (++uid).toString(),
    store: createStore(globalEvents, options),
    globalEvents: generateFlushEvents(globalEvents),
    events: createEventSource(),
    parent: undefined,
    onSubscribe: undefined,
    onUnsubscribe: undefined,
  };
}

export function createChildScope(
  parent: Scope,
  options?: {
    redispatch?: ((event: MusterEvent) => MusterEvent | undefined) | true;
    onSubscribe?: () => void;
    onUnsubscribe?: () => void;
  },
): Scope {
  return {
    [SCOPE]: true,
    // tslint:disable-next-line:no-increment-decrement
    id: (++uid).toString(),
    store: parent.store,
    globalEvents: parent.globalEvents,
    events: getChildEventSource(parent.events, options && options.redispatch),
    parent,
    onSubscribe: options && options.onSubscribe,
    onUnsubscribe: options && options.onUnsubscribe,
  };
}

function createEventSource(): MusterEventSource {
  return new Emitter<MusterEvent>();
}

function getChildEventSource(
  source: MusterEventSource,
  redispatch: ((event: MusterEvent) => MusterEvent | undefined) | true | undefined,
): MusterEventSource {
  if (!redispatch) {
    return createEventSource();
  }
  if (redispatch === true) {
    return source;
  }
  return flatMap((event) => {
    const mappedEvent = redispatch(event);
    return mappedEvent ? [mappedEvent] : [];
  }, source);
}

function generateFlushEvents(emitter: MusterEventSource): MusterEventSource {
  let pendingTransactions = 0;
  emitter.listen((event) => {
    switch (event.type) {
      case TRANSACTION_START:
        // tslint:disable-next-line:no-increment-decrement
        ++pendingTransactions;
        return;
      case TRANSACTION_END:
        // tslint:disable-next-line:no-increment-decrement
        if (--pendingTransactions === 0) {
          emitter.queue({ type: FLUSH, payload: undefined });
        }
        return;
      default:
        return;
    }
  });
  return emitter;
}
