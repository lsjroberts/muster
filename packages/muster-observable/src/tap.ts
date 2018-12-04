import { DisposeCallback, ObservableLike, Observer } from './types';

import Observable from './observable';

function noop(): void {}

export default function tap<T>(
  callback: Observer<T> | Observer<T>['next'],
  stream: ObservableLike<T>,
): ObservableLike<T> {
  const subscriber =
    typeof callback === 'function' ? { next: callback, complete: noop, error: noop } : callback;
  // tslint:disable-next-line:ter-prefer-arrow-callback
  return new Observable(function factory(observer: Observer<T>): DisposeCallback {
    const subscription = stream.subscribe({
      next(value: T) {
        subscriber.next(value);
        observer.next(value);
      },
      error(value: any) {
        subscriber.error(value);
        observer.error(value);
      },
      complete() {
        subscriber.complete();
        observer.complete();
      },
    });
    return function unsubscribe() {
      subscription.unsubscribe();
    };
  });
}
