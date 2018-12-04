import { DisposeCallback, ObservableLike } from '../types';

import combineLatest from '../combine-latest';
import { default as observableMerge } from '../merge';
import Observable from '../observable';
import Subject from '../subject';

export { default as filter } from '../filter';
export { default as map } from '../map';
export { default as scan } from '../scan';
export { default as switchLatest } from '../switch-latest';
export { default as skipRepeats } from '../distinct-until-changed';
export { default as tap } from '../tap';

export type Stream<T> = ObservableLike<T>;

export function just<T>(value: T): ObservableLike<T> {
  return Observable.of(value);
}
export function hold<T>(stream: ObservableLike<T>): ObservableLike<T> {
  return stream;
}
export function merge<T>(...streams: Array<Stream<T>>): Stream<T> {
  return observableMerge(streams);
}
export function sync<T>() {
  return new Subject<T>();
}
export function create<T>(
  factory: (
    next: (value: T) => void,
    complete: () => void,
    error: (error: Error) => void,
  ) => DisposeCallback | void,
) {
  return new Observable<T>((observer) => factory(observer.next, observer.complete, observer.error));
}
export function combineArray<T, V>(
  combiner: (...values: Array<T>) => V,
  streams: Array<ObservableLike<T>>,
): ObservableLike<V> {
  return combineLatest((values: Array<T>) => combiner(...values), streams);
}

export interface Emitter<T> {
  emit(event: T): void;
  listen(callback: (event: T) => void): () => void;
}
