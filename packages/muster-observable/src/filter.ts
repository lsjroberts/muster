import { DisposeCallback, ObservableLike, Observer } from './types';

import Observable from './observable';

export default function filter<T>(
  predicate: (value: T, index: number) => boolean,
  stream: ObservableLike<T>,
): ObservableLike<T> {
  // tslint:disable-next-line:ter-prefer-arrow-callback
  return new Observable(function factory(observer: Observer<T>): DisposeCallback {
    let index = -1;
    // tslint:disable-next-line:ter-prefer-arrow-callback
    const subscription = stream.subscribe({
      next(value: T): void {
        // tslint:disable-next-line:no-increment-decrement no-param-reassign
        const isAllowed = predicate(value, ++index);
        if (isAllowed) {
          observer.next(value);
        }
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
