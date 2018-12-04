import { ObservableLike } from './types';

import distinct from './distinct';

function notEqual(value1: any, value2: any): boolean {
  return value1 !== value2;
}

export default function distinctUntilChanged<T>(stream: ObservableLike<T>): ObservableLike<T> {
  return distinct(notEqual, stream);
}
