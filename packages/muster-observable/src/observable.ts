import { DisposeCallback, ObservableLike, Observer, Subscription } from './types';

function noop(): void {}

export const PENDING = {} as never;

export default class Observable<T> implements ObservableLike<T> {
  constructor(factory: (observer: Observer<T>) => DisposeCallback | undefined | void) {
    this.factory = factory;
  }

  private factory: (observer: Observer<T>) => DisposeCallback | undefined | void;
  private teardown: (() => void) = noop;
  private observers: Array<Observer<T>> = [];
  private hasCompleted: boolean = false;
  protected currentValue: T | (typeof PENDING) = PENDING;

  subscribe(subscriber: Observer<T> | Observer<T>['next']): Subscription {
    const observer =
      typeof subscriber === 'function'
        ? { next: subscriber, error: noop, complete: noop }
        : subscriber;
    this.observers.push(observer);
    const isFirstSubscription = this.observers.length === 1;
    if (isFirstSubscription) {
      let isAsync = false;
      this.teardown =
        this.factory({
          next: (value: T) => {
            if (this.hasCompleted) {
              return;
            }
            this.currentValue = value;
            // tslint:disable-next-line:no-increment-decrement
            for (let i = 0; i < this.observers.length; i++) {
              this.observers[i].next(value);
            }
          },
          error: (error: any) => {
            if (this.hasCompleted) {
              return;
            }
            this.hasCompleted = true;
            if (isAsync) {
              this.teardown();
            }
            // tslint:disable-next-line:no-increment-decrement
            for (let i = 0; i < this.observers.length; i++) {
              this.observers[i].error(error);
            }
          },
          complete: () => {
            if (this.hasCompleted) {
              return;
            }
            this.hasCompleted = true;
            if (isAsync) {
              this.teardown();
            }
            // tslint:disable-next-line:no-increment-decrement
            for (let i = 0; i < this.observers.length; i++) {
              this.observers[i].complete();
            }
          },
        }) || noop;
      isAsync = true;
      if (this.hasCompleted) {
        this.teardown();
        this.teardown = noop;
        this.hasCompleted = false;
        this.currentValue = PENDING;
      }
    } else if (this.currentValue !== PENDING) {
      observer.next(this.currentValue);
    }
    let unsubscribed = false;
    return {
      unsubscribe: () => {
        if (unsubscribed || this.hasCompleted) {
          return;
        }
        // tslint:disable-next-line:no-param-reassign
        unsubscribed = true;
        this.observers.splice(this.observers.indexOf(observer), 1);
        if (this.observers.length === 0) {
          this.teardown();
          this.teardown = noop;
          this.hasCompleted = false;
          this.currentValue = PENDING;
        }
      },
    };
  }

  static of<T>(value: T): ObservableLike<T> {
    // tslint:disable-next-line:ter-prefer-arrow-callback
    return new Observable(function factory(observer: Observer<T>): void {
      observer.next(value);
      observer.complete();
    });
  }

  static from<T>(values: Array<T>): ObservableLike<T> {
    // tslint:disable-next-line:ter-prefer-arrow-callback
    return new Observable(function factory(observer: Observer<T>): void {
      // tslint:disable-next-line:no-increment-decrement
      for (let i = 0; i < values.length; i++) {
        observer.next(values[i]);
      }
      observer.complete();
    });
  }

  static empty(): ObservableLike<never> {
    // tslint:disable-next-line:ter-prefer-arrow-callback
    return new Observable(function factory(observer: Observer<never>): void {
      observer.complete();
    });
  }

  static never(): ObservableLike<never> {
    return new Observable(noop);
  }

  static defer<T>(observableFactory: () => ObservableLike<T>): ObservableLike<T> {
    // tslint:disable-next-line:ter-prefer-arrow-callback
    return new Observable(function factory(observer: Observer<T>): DisposeCallback {
      const stream = observableFactory();
      const subscription = stream.subscribe(observer);
      return function unsubscribe(): void {
        subscription.unsubscribe();
      };
    });
  }
}
