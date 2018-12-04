import { DisposeCallback, ObservableLike, Observer } from './types';

import map from './map';
import Observable from './observable';

export default function combineLatest<T, V>(
  combiner: (values: Array<T>) => V,
  streams: Array<ObservableLike<T>>,
): ObservableLike<V> {
  if (streams.length === 0) {
    return Observable.defer(() => Observable.of(combiner([])));
  }
  if (streams.length === 1) {
    return map(
      // tslint:disable-next-line:ter-prefer-arrow-callback
      function combineLatestMap(value: T): V {
        return combiner([value]);
      },
      streams[0],
    );
  }
  // tslint:disable-next-line:ter-prefer-arrow-callback
  return new Observable(function factory(observer: Observer<V>): DisposeCallback {
    const observerFactory = createCombineLatestObserverFactory(streams, {
      next(values: Array<T>): void {
        const combinedValue = combiner(values);
        observer.next(combinedValue);
      },
      error(error: any): void {
        observer.error(error);
      },
      complete(): void {
        observer.complete();
      },
    });
    const subscriptions = streams.map((stream, index) => stream.subscribe(observerFactory(index)));
    return function unsubscribe(): void {
      // tslint:disable-next-line:no-increment-decrement
      for (let i = 0; i < subscriptions.length; i++) {
        subscriptions[i].unsubscribe();
      }
    };
  });
}

function createCombineLatestObserverFactory<T>(
  streams: Array<ObservableLike<T>>,
  observer: Observer<Array<T>>,
): (index: number) => Observer<T> {
  const PENDING = {} as never;
  const currentValues: Array<T | typeof PENDING> = streams.map((stream) => PENDING);
  const hasCompleted = streams.map(() => false);
  let isReady = currentValues.length === 0;
  return function callbackForIndex(index: number): Observer<T> {
    return {
      next(value: T): void {
        currentValues[index] = value;
        if (isReady || (isReady = !currentValues.some(isPending))) {
          observer.next(currentValues.map((currentValue) => currentValue));
        }
      },
      error(error: any): void {
        observer.error(error);
      },
      complete(): void {
        hasCompleted[index] = true;
        if (hasCompleted.every(Boolean)) {
          observer.complete();
        }
      },
    };
  };
  function isPending(value: any): boolean {
    return value === PENDING;
  }
}
