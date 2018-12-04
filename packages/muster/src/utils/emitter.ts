export type UnsubscribeCallback = {
  (): void;
};

export type EmitterCallback<T> = {
  (event: T): void;
};

export interface EventEmitter<T> {
  emit(event: T): void;
  queue(event: T): void;
  listen(callback: EmitterCallback<T>): UnsubscribeCallback;
}

export class Emitter<T> {
  private listeners: Array<EmitterCallback<T>> = [];
  private isEmitting: boolean = false;
  private queuedEvents: Array<T> = [];

  emit(event: T): void {
    this.isEmitting = true;
    this.listeners.forEach((listener) => listener(event));
    this.isEmitting = false;
    if (this.queuedEvents.length > 0) {
      this.emit(this.queuedEvents.shift()!);
    }
  }

  queue(event: T): void {
    if (this.isEmitting) {
      this.queuedEvents.push(event);
    } else {
      this.emit(event);
    }
  }

  listen(callback: EmitterCallback<T>): UnsubscribeCallback {
    let isUnsubscribed = false;
    this.listeners = [...this.listeners, callback];
    return () => {
      if (isUnsubscribed) {
        return;
      }
      isUnsubscribed = true;
      const listeners = this.listeners;
      const listenerIndex = listeners.indexOf(callback);
      this.listeners = [
        ...listeners.slice(0, listenerIndex),
        ...listeners.slice(listenerIndex + 1),
      ];
    };
  }
}

export function flatMap<T, V>(
  transform: (event: T) => Array<V>,
  source: EventEmitter<T>,
): EventEmitter<V> {
  const output = new Emitter<V>();
  let numSubscriptions = 0;
  let sourceSubscription: UnsubscribeCallback | undefined;
  return {
    emit(event: V): void {
      output.emit(event);
    },
    queue(event: V): void {
      output.queue(event);
    },
    listen(callback: EmitterCallback<V>): UnsubscribeCallback {
      let isUnsubscribed = false;
      // tslint:disable-next-line:no-increment-decrement
      if (++numSubscriptions === 1 && !sourceSubscription) {
        sourceSubscription = source.listen((event: T) => {
          transform(event).forEach((mappedEvent) => output.emit(mappedEvent));
        });
      }
      const subscription = output.listen(callback);
      return function unsubscribe(): void {
        if (isUnsubscribed) {
          return;
        }
        isUnsubscribed = true;
        subscription();
        // tslint:disable-next-line:no-increment-decrement
        if (--numSubscriptions === 0 && sourceSubscription) {
          sourceSubscription();
          sourceSubscription = undefined;
        }
      };
    },
  };
}
