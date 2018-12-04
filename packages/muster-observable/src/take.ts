import { DisposeCallback, ObservableLike, Observer } from './types';

import Observable from './observable';

export default function take<T>(count: number, stream: ObservableLike<T>): ObservableLike<T> {
  if (count <= 0) {
    return Observable.empty();
  }
  return new Observable(function factory(observer: Observer<T>): DisposeCallback {
    let isComplete = false;
    let isAsync = false;
    let index = -1;
    // tslint:disable-next-line:ter-prefer-arrow-callback
    const subscription = stream.subscribe({
      next(value: T): void {
        // tslint:disable-next-line:no-increment-decrement
        isComplete = ++index >= count - 1;
        observer.next(value);
        if (isComplete) {
          if (isAsync) {
            subscription.unsubscribe();
          }
          observer.complete();
        }
      },
      error(error: any): void {
        observer.error(error);
      },
      complete(): void {
        observer.complete();
      },
    });
    if (isComplete) {
      subscription.unsubscribe();
    }
    isAsync = true;
    return function unsubscribe(): void {
      if (!isComplete) {
        subscription.unsubscribe();
      }
    };
  });
}
