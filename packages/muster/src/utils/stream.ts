import { ObservableLike, Observer, Subscription } from '@dws/muster-observable';
import noop from 'lodash/noop';
import { Stream, StreamSubscription, StreamUpdateCallback, Subject } from '../types/stream';

const PENDING = {} as never;

export function never(): Stream<never> {
  return createStream(
    (callback: StreamUpdateCallback<never>): StreamSubscription => {
      return createSubscription({
        unsubscribe: noop,
        invalidate: noop,
      });
    },
  );
}

export function just<T>(value: T): Stream<T> {
  return createStream(
    (callback: StreamUpdateCallback<T>): StreamSubscription => {
      callback(value);
      return createSubscription({
        unsubscribe: noop,
        invalidate() {
          callback(value);
        },
      });
    },
  );
}

export function defer<T>(factory: () => Stream<T>): Stream<T> {
  return createStream(
    (callback: StreamUpdateCallback<T>): StreamSubscription => {
      const stream = factory();
      return stream(callback);
    },
  );
}

export function skipRepeatedValues<T>(
  equality: (value: T, previousValue: T) => boolean,
  stream: Stream<T>,
): Stream<T> {
  return createStream(
    (callback: StreamUpdateCallback<T>): StreamSubscription => {
      let previousValue: T = PENDING;
      let subscription = stream((value: T) => {
        if (previousValue !== PENDING && equality(value, previousValue)) return;
        previousValue = value;
        callback(value);
      });
      return createSubscription({
        unsubscribe() {
          if (!subscription) return;
          subscription.unsubscribe();
          subscription = undefined as any;
          previousValue = PENDING;
        },
        invalidate() {
          previousValue = PENDING;
          subscription.invalidate();
        },
      });
    },
  );
}

export function filter<T>(predicate: (value: T) => boolean, stream: Stream<T>): Stream<T> {
  return createStream(
    (callback: StreamUpdateCallback<T>): StreamSubscription =>
      stream((value) => {
        if (predicate(value)) {
          callback(value);
        }
      }),
  );
}

export function map<T, V>(project: (value: T) => V, stream: Stream<T>): Stream<V> {
  return createStream(
    (callback: StreamUpdateCallback<V>): StreamSubscription =>
      stream((value: T) => callback(project(value))),
  );
}

export function tap<T>(fn: (value: T) => void, stream: Stream<T>): Stream<T> {
  return createStream(
    (callback: StreamUpdateCallback<T>): StreamSubscription =>
      stream((value: T) => {
        fn(value);
        callback(value);
      }),
  );
}

export function merge<T>(...streams: Array<Stream<T>>): Stream<T> {
  return createStream(
    (callback: StreamUpdateCallback<T>): StreamSubscription => {
      let subscriptions = streams.map((stream) => stream(callback));
      return createSubscription({
        unsubscribe() {
          if (!subscriptions) return;
          subscriptions.forEach((subscription) => subscription.unsubscribe());
          subscriptions = undefined as any;
        },
        invalidate() {
          subscriptions.forEach((subscription) => subscription.invalidate());
        },
      });
    },
  );
}

export function flatten<T>(stream: Stream<Stream<T>>): Stream<T> {
  return createStream(
    (callback: StreamUpdateCallback<T>): StreamSubscription => {
      let innerSubscription: StreamSubscription;
      let subscription = stream((value: Stream<T>) => {
        if (innerSubscription) {
          innerSubscription.unsubscribe();
        }
        innerSubscription = value(callback);
      });
      return createSubscription({
        unsubscribe(): void {
          if (innerSubscription) {
            innerSubscription.unsubscribe();
            innerSubscription = undefined as any;
          }
          if (subscription) {
            subscription.unsubscribe();
            subscription = undefined as any;
          }
        },
        invalidate(): void {
          if (innerSubscription) {
            innerSubscription.unsubscribe();
          }
          subscription.invalidate();
        },
      });
    },
  );
}

export function combineLatest<T, V>(
  combine: (values: Array<T>) => V,
  streams: Array<Stream<T>>,
): Stream<V> {
  return map(
    combine,
    streams.length === 0
      ? just([])
      : createStream(
          (callback: StreamUpdateCallback<Array<T>>): StreamSubscription => {
            let currentValues = streams.map(() => PENDING) as Array<T>;
            let isReady = false;
            let subscriptions = streams.map((stream, index) =>
              stream((value: T) => {
                onUpdate(index, value);
              }),
            );
            return createSubscription({
              unsubscribe(): void {
                if (!subscriptions) return;
                subscriptions.forEach((subscription) => subscription.unsubscribe());
                subscriptions = undefined as any;
                currentValues = streams.map(() => PENDING) as Array<T>;
              },
              invalidate(): void {
                isReady = false;
                currentValues.forEach((value, index) => {
                  currentValues[index] = PENDING;
                });
                subscriptions.forEach((subscription) => subscription.invalidate());
              },
            });

            function onUpdate(index: number, value: T): void {
              currentValues[index] = value;
              if (isReady || (isReady = currentValues.every((value) => value !== PENDING))) {
                callback(currentValues);
              }
            }
          },
        ),
  );
}

export function sample<T>(sampleStream: Stream<any>, sourceStream: Stream<T>): Stream<T> {
  return createStream(
    (callback: StreamUpdateCallback<T>): StreamSubscription => {
      let lastItem: T | typeof PENDING = PENDING;
      let sampleSubscription = sampleStream(() => {
        if (lastItem !== PENDING) {
          const value = lastItem;
          lastItem = PENDING;
          callback(value);
        }
      });
      let sourceSubscription = sourceStream((value: T) => {
        lastItem = value;
      });
      return createSubscription({
        unsubscribe(): void {
          if (sampleSubscription) {
            sampleSubscription.unsubscribe();
            sampleSubscription = undefined as any;
          }
          if (sourceSubscription) {
            sourceSubscription.unsubscribe();
            sourceSubscription = undefined as any;
          }
          lastItem = PENDING;
        },
        invalidate(): void {
          lastItem = PENDING;
          sourceSubscription.invalidate();
          sampleSubscription.invalidate();
        },
      });
    },
  );
}

export function takeFirst<T>(stream: Stream<T>): Stream<T> {
  return createStream(
    (callback: StreamUpdateCallback<T>): StreamSubscription => {
      let isSync = true;
      let isCompleted = false;
      let subscription = subscribe();
      function subscribe() {
        return stream((value: T) => {
          if (isCompleted) return;
          isCompleted = true;
          if (!isSync && subscription) {
            subscription.unsubscribe();
            subscription = undefined as any;
          }
          callback(value);
        });
      }
      isSync = false;
      if (isCompleted && subscription) {
        subscription.unsubscribe();
        subscription = undefined as any;
      }
      return createSubscription({
        unsubscribe(): void {
          if (!isCompleted && subscription) {
            subscription.unsubscribe();
            subscription = undefined as any;
          }
        },
        invalidate(): void {
          if (isCompleted) {
            isCompleted = false;
            subscription = subscribe();
          } else {
            subscription.invalidate();
          }
        },
      });
    },
  );
}

export function takeUntilPredicate<T>(
  predicate: (value: T) => boolean,
  stream: Stream<T>,
): Stream<T> {
  return createStream(
    (callback: StreamUpdateCallback<T>): StreamSubscription => {
      let isSync = true;
      let isCompleted = false;
      let subscription = subscribe();
      function subscribe() {
        return stream((value: T) => {
          if (isCompleted) return;
          if (predicate(value)) {
            isCompleted = true;
            if (!isSync && subscription) {
              subscription.unsubscribe();
              subscription = undefined as any;
            }
          }
          callback(value);
        });
      }
      isSync = false;
      if (isCompleted && subscription) {
        subscription.unsubscribe();
        subscription = undefined as any;
      }
      return createSubscription({
        unsubscribe(): void {
          if (!isCompleted && subscription) {
            subscription.unsubscribe();
            subscription = undefined as any;
          }
        },
        invalidate(): void {
          if (isCompleted) {
            isCompleted = false;
            subscription = subscribe();
          } else {
            subscription.invalidate();
          }
        },
      });
    },
  );
}

export function switchMap<V, T>(project: (value: V) => Stream<T>, stream: Stream<V>): Stream<T> {
  return createStream(
    (callback: StreamUpdateCallback<T>): StreamSubscription => {
      let innerSubscription: StreamSubscription;
      let subscription = stream((value: V) => {
        if (innerSubscription) {
          innerSubscription.unsubscribe();
        }
        const innerStream = project(value);
        innerSubscription = innerStream(callback);
      });
      return createSubscription({
        unsubscribe(): void {
          if (innerSubscription) {
            innerSubscription.unsubscribe();
            innerSubscription = undefined as any;
          }
          if (subscription) {
            subscription.unsubscribe();
            subscription = undefined as any;
          }
        },
        invalidate(): void {
          if (innerSubscription) {
            innerSubscription.unsubscribe();
          }
          subscription.invalidate();
        },
      });
    },
  );
}

function isStream(value: any): value is Stream<any> {
  return typeof value === 'function';
}

export function mapRecursive<T>(
  project: (value: T) => T | Stream<T>,
  stream: Stream<T>,
): Stream<T> {
  return createStream(
    (callback: StreamUpdateCallback<T>): StreamSubscription => {
      let innerSubscription: StreamSubscription;
      let subscription = stream((value: T) => {
        if (innerSubscription) {
          innerSubscription.unsubscribe();
          innerSubscription = undefined as any;
        }
        const result = project(value);
        if (!isStream(result)) {
          return callback(result);
        }
        const innerStream = mapRecursive(project, result);
        innerSubscription = innerStream(callback);
      });
      return createSubscription({
        unsubscribe(): void {
          if (innerSubscription) {
            innerSubscription.unsubscribe();
            innerSubscription = undefined as any;
          }
          if (subscription) {
            subscription.unsubscribe();
            subscription = undefined as any;
          }
        },
        invalidate(): void {
          if (innerSubscription) {
            innerSubscription.unsubscribe();
          }
          subscription.invalidate();
        },
      });
    },
  );
}

export function addStreamListeners<T>(
  stream: Stream<T>,
  options: {
    subscribe?: () => void;
    unsubscribe?: () => void;
    invalidate?: (invalidate: () => void) => void;
  },
): Stream<T> {
  return createStream(
    (callback: StreamUpdateCallback<T>): StreamSubscription => {
      if (options.subscribe) {
        options.subscribe();
      }
      let subscription = stream(callback);
      return createSubscription({
        unsubscribe(): void {
          if (options.unsubscribe) options.unsubscribe();
          if (subscription) {
            subscription.unsubscribe();
            subscription = undefined as any;
          }
        },
        invalidate(): void {
          if (options.invalidate) {
            let hasInvalidatedSource = false;
            options.invalidate(() => {
              hasInvalidatedSource = true;
              subscription.invalidate();
            });
            if (!hasInvalidatedSource) {
              subscription.invalidate();
            }
          } else {
            subscription.invalidate();
          }
        },
      });
    },
  );
}

export function subject<T>(): Subject<T> {
  const listeners = [] as Array<StreamUpdateCallback<T>>;
  return Object.assign(
    createStream(
      (callback: StreamUpdateCallback<T>): StreamSubscription => {
        listeners.push(callback);
        return createSubscription({
          unsubscribe(): void {
            listeners.splice(listeners.indexOf(callback), 1);
          },
          invalidate: noop,
        });
      },
    ),
    {
      next(value: T): void {
        listeners.forEach((listener) => listener(value));
      },
    },
  );
}

export function behaviorSubject<T>(initialValue: T): Subject<T> {
  const innerSubject = subject<T>();
  let currentValue = initialValue;
  return Object.assign(
    createStream(
      (callback: StreamUpdateCallback<T>): StreamSubscription => {
        let hasEmitted = false;
        let subscription = innerSubject((value: T) => {
          hasEmitted = true;
          callback(value);
        });
        if (!hasEmitted) {
          callback(currentValue);
        }
        return createSubscription({
          unsubscribe() {
            if (!subscription) return;
            subscription.unsubscribe();
            subscription = undefined as any;
          },
          invalidate() {
            hasEmitted = false;
            subscription.invalidate();
            if (!hasEmitted) {
              callback(currentValue);
            }
          },
        });
      },
    ),
    {
      next(value: T): void {
        innerSubject.next((currentValue = value));
      },
    },
  );
}

export function share<T>(stream: Stream<T>): Stream<T> {
  let innerSubscription: StreamSubscription | undefined;
  const listeners: Array<StreamUpdateCallback<T>> = [];
  let currentValue: T = PENDING;
  function invalidate() {
    currentValue = PENDING;
    if (innerSubscription) {
      innerSubscription.invalidate();
    }
  }
  return Object.assign(
    (callback: StreamUpdateCallback<T>): StreamSubscription => {
      listeners.push(callback);
      if (!innerSubscription) {
        innerSubscription = stream(
          (value: T): void => {
            currentValue = value;
            listeners.forEach((callback) => callback(currentValue));
          },
        );
      } else if (currentValue !== PENDING) {
        callback(currentValue);
      }
      return createSubscription({
        unsubscribe() {
          listeners.splice(listeners.indexOf(callback), 1);
          if (listeners.length === 0 && innerSubscription) {
            innerSubscription.unsubscribe();
            innerSubscription = undefined as any;
            currentValue = PENDING;
          }
        },
        invalidate,
      });
    },
    {
      invalidate,
    },
  );
}

export function fromEmitter<T>(emitter: {
  emit(event: T): void;
  listen(callback: (event: T) => void): () => void;
}): Stream<T> {
  return createStream(
    (callback: StreamUpdateCallback<T>): StreamSubscription => {
      let unsubscribe = emitter.listen(callback);
      return createSubscription({
        unsubscribe() {
          unsubscribe();
          unsubscribe = undefined as any;
        },
        invalidate: noop,
      });
    },
  );
}

export function toObservable<T>(stream: Stream<T>): ObservableLike<T> {
  return {
    subscribe(observer: Observer<T> | Observer<T>['next']): Subscription {
      let subscription = stream(typeof observer === 'function' ? observer : observer.next);
      return {
        unsubscribe() {
          if (!subscription) return;
          subscription.unsubscribe();
          subscription = undefined as any;
        },
      };
    },
  };
}

export function createStream<T>(
  factory: (callback: StreamUpdateCallback<T>) => StreamSubscription,
): Stream<T> {
  let subscriptions = [] as Array<StreamSubscription>;
  const stream = (callback: StreamUpdateCallback<T>) => {
    let isUnsubscribed = false;
    let subscription = factory(callback);
    subscriptions.push(subscription);
    return {
      unsubscribe() {
        if (isUnsubscribed) {
          return;
        }
        isUnsubscribed = true;
        if (subscriptions.length === 1) {
          subscriptions = [];
        } else {
          subscriptions.splice(subscriptions.indexOf(subscription), 1);
        }
        if (subscription) {
          subscription.unsubscribe();
          subscription = undefined as any;
        }
      },
      invalidate: subscription.invalidate,
    };
  };
  return Object.assign(stream, {
    invalidate() {
      subscriptions.forEach((subscription) => {
        subscription.invalidate();
      });
    },
  });
}

export function createSubscription(actions: {
  unsubscribe(): void;
  invalidate(): void;
}): StreamSubscription {
  const { unsubscribe, invalidate } = actions;
  let isUnsubscribed = false;
  return {
    unsubscribe() {
      if (isUnsubscribed) {
        return;
      }
      isUnsubscribed = true;
      unsubscribe();
    },
    invalidate() {
      if (isUnsubscribed) {
        return;
      }
      invalidate();
    },
  };
}
