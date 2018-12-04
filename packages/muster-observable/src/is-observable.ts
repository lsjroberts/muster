import { ObservableLike } from './types';

export default function isObservable(value: any): value is ObservableLike<any> {
  return typeof value.subscribe === 'function';
}
