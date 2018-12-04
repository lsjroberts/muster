export type StreamUpdateCallback<T> = (value: T) => void;

export interface Stream<T> {
  (callback: StreamUpdateCallback<T>): StreamSubscription;
  invalidate(): void;
}

export interface Subject<T> extends Stream<T> {
  next(value: T): void;
}

export interface StreamSubscription {
  unsubscribe(): void;
  invalidate(): void;
}
