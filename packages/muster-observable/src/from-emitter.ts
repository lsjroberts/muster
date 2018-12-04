import { DisposeCallback, ObservableLike, Observer } from './types';

import Observable from './observable';

export default function fromEmitter<T>(emitter: {
  emit(event: T): void;
  listen(callback: (event: T) => void): () => void;
}): ObservableLike<T> {
  // tslint:disable-next-line:ter-prefer-arrow-callback
  return new Observable(function factory(observer: Observer<T>): DisposeCallback {
    // tslint:disable-next-line:ter-prefer-arrow-callback
    return emitter.listen(function callback(value: T): void {
      observer.next(value);
    });
    // tslint:disable-next-line:ter-prefer-arrow-callback
  });
}
