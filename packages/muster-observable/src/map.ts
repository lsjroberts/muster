import { DisposeCallback, ObservableLike, Observer } from './types';

import Observable from './observable';

export default function map<T, V>(
  iteratee: (value: T, index: number) => V,
  stream: ObservableLike<T>,
): ObservableLike<V> {
  // tslint:disable-next-line:ter-prefer-arrow-callback
  return new Observable(function factory(observer: Observer<V>): DisposeCallback {
    let index = -1;
    // tslint:disable-next-line:ter-prefer-arrow-callback
    const subscription = stream.subscribe({
      next(value: T): void {
        // tslint:disable-next-line:no-increment-decrement no-param-reassign
        const mappedValue = iteratee(value, ++index);
        observer.next(mappedValue);
      },
      error(error: any): void {
        observer.error(error);
      },
      complete(): void {
        observer.complete();
      },
    });
    return function unsubscribe(): void {
      subscription.unsubscribe();
    };
  });
}
