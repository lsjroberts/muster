import Subject from './subject';

export default class BehaviorSubject<T> extends Subject<T> {
  constructor(initialValue: T) {
    super();
    this.currentValue = initialValue;
    this.subscribe(() => {});
  }
}
