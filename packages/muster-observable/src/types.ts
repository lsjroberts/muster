export type DisposeCallback = () => void;

export interface Subscription {
  unsubscribe(): void;
}

export interface Observer<T> {
  next(value: T): void;
  error(error: Error): void;
  complete(): void;
}

export interface ObservableLike<T> {
  subscribe(observer: Observer<T> | Observer<T>['next']): Subscription;
}
