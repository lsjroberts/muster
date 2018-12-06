import { ObservableLike } from './types';

import map from './map';
import switchLatest from './switch-latest';

export default function switchMap<T, V>(
  iteratee: (value: T, index: number) => ObservableLike<V>,
  stream: ObservableLike<T>,
): ObservableLike<V> {
  return switchLatest(map(iteratee, stream));
}
