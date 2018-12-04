import { ObservableLike } from './types';

import filter from './filter';
import Observable from './observable';

export default function distinct<T>(
  comparator: (value1: T, value2: T) => boolean,
  stream: ObservableLike<T>,
): ObservableLike<T> {
  // tslint:disable-next-line:ter-prefer-arrow-callback
  return Observable.defer(function factory() {
    let currentValue: T | undefined = undefined;
    return filter(
      // tslint:disable-next-line:ter-prefer-arrow-callback
      function distinctFilter(value: T, index: number): boolean {
        const previousValue = currentValue;
        currentValue = value;
        return index === 0 ? true : comparator(value, previousValue!);
      },
      stream,
    );
  });
}
