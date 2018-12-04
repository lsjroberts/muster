import { DisposeCallback, Observer } from './types';

import Observable, { PENDING } from './observable';

export default class Subject<T> extends Observable<T> {
  constructor() {
    super(
      (observer: Observer<T>): DisposeCallback => {
        this.subjectObservers.push(observer);
        if (this.currentValue !== PENDING) {
          observer.next(this.currentValue);
        }
        return () => {
          this.subjectObservers.splice(this.subjectObservers.indexOf(observer), 1);
        };
      },
    );
  }

  private subjectObservers: Array<Observer<T>> = [];

  complete(): void {
    // tslint:disable-next-line:no-increment-decrement
    for (let i = 0; i < this.subjectObservers.length; i++) {
      this.subjectObservers[i].complete();
    }
  }

  next(value: T): void {
    // tslint:disable-next-line:no-increment-decrement
    for (let i = 0; i < this.subjectObservers.length; i++) {
      this.subjectObservers[i].next(value);
    }
  }
}
