import { ObservableLike } from './types';

import fromPromise from './from-promise';
import isObservable from './is-observable';
import Observable from './observable';

/**
 * Convert the provided value to an observable sequence
 * @param {Observable|Promise|any} value Value to convert to an observable
 * @returns {Observable} Observable sequence
 */
export default function toObservable<T>(
  value: T | Promise<T> | ObservableLike<T>,
): ObservableLike<T> {
  if (value === undefined) {
    return Observable.empty();
  }
  if (isObservable(value)) {
    return value;
  }
  if (isPromise(value)) {
    return fromPromise(value);
  }
  return Observable.of(value);
}

function isPromise(value?: any): value is Promise<any> {
  return Boolean(value) && typeof value.then === 'function';
}
