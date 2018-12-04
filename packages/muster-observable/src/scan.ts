import { ObservableLike } from './types';

import Observable from './observable';

import map from './map';

export default function scan<T, V, I = V>(
  reducer: (accumulator: V | I, value: T, index: number) => V,
  initialValue: I,
  stream: ObservableLike<T>,
): ObservableLike<V> {
  // tslint:disable-next-line:ter-prefer-arrow-callback
  return Observable.defer(function factory() {
    let currentValue: V | I = initialValue;
    return map(
      // tslint:disable-next-line:ter-prefer-arrow-callback
      function scanMap(value: T, index: number): V {
        const updatedValue = reducer(currentValue, value, index);
        return (currentValue = updatedValue);
      },
      stream,
    );
  });
}
