import { ObservableLike, Observer } from './types';

import Observable from './observable';

export default function merge<T>(streams: Array<ObservableLike<T>>): ObservableLike<T> {
  // tslint:disable-next-line:ter-prefer-arrow-callback
  return new Observable(function factory(observer: Observer<T>) {
    const hasCompleted = streams.map(() => false);
    const subscriptions = streams.map((stream, index) =>
      stream.subscribe({
        next(value: T): void {
          observer.next(value);
        },
        error(value: any): void {
          observer.error(value);
        },
        complete() {
          hasCompleted[index] = true;
          if (hasCompleted.every(Boolean)) {
            observer.complete();
          }
        },
      }),
    );
    return function unsubscribe() {
      // tslint:disable-next-line:no-increment-decrement
      for (let i = 0; i < subscriptions.length; i++) {
        subscriptions[i].unsubscribe();
      }
    };
  });
}
