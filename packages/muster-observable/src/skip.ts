import { ObservableLike } from './types';

import filter from './filter';

export default function skip<T>(count: number, stream: ObservableLike<T>): ObservableLike<T> {
  if (count <= 0) {
    return stream;
  }
  return filter(
    // tslint:disable-next-line:ter-prefer-arrow-callback
    function skipFilter(value: T, index: number): boolean {
      return index >= count;
    },
    stream,
  );
}
