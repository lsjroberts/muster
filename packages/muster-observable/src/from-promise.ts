import { ObservableLike, Observer } from './types';

import Observable from './observable';

export default function fromPromise<T>(promise: Promise<T>): ObservableLike<T> {
  // tslint:disable-next-line:ter-prefer-arrow-callback
  return new Observable(function factory(observer: Observer<T>) {
    promise.then(
      // tslint:disable-next-line:ter-prefer-arrow-callback
      function resolve(value: T): void {
        observer.next(value);
        observer.complete();
      },
      // tslint:disable-next-line:ter-prefer-arrow-callback
      function reject(value: any): void {
        observer.error(value);
      },
    );
  });
}
