import { DisposeCallback, ObservableLike, Observer, Subscription } from './types';

import Observable from './observable';

function noop(): void {}

export default function switchLatest<T>(
  stream: ObservableLike<ObservableLike<T>>,
): ObservableLike<T> {
  let currentStream: ObservableLike<T> | undefined = undefined;
  let currentSubscription: Subscription | undefined = undefined;
  // tslint:disable-next-line:ter-prefer-arrow-callback
  return new Observable(function factory(observer: Observer<T>): DisposeCallback {
    const subscription = stream.subscribe({
      next(value: ObservableLike<T>): void {
        if (value === currentStream) {
          return;
        }
        if (currentSubscription) {
          currentSubscription.unsubscribe();
        }
        currentSubscription = (currentStream = value).subscribe({
          next(value: any): void {
            observer.next(value);
          },
          error(value: any): void {
            observer.error(value);
          },
          complete: noop,
        });
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
      if (currentSubscription) {
        currentSubscription.unsubscribe();
      }
    };
  });
}
