import Observable from './observable';
import Subject from './subject';
import { DisposeCallback, ObservableLike, Observer } from './types';

export default class TransformSubject<I, O> extends Observable<O> {
  constructor(transform: (input: ObservableLike<I>) => ObservableLike<O>) {
    super(
      (observer: Observer<O>): DisposeCallback => {
        const subscription = this.output.subscribe(observer);
        return () => {
          subscription.unsubscribe();
        };
      },
    );
    this.input = new Subject<I>();
    this.output = transform(this.input);
  }

  private input: Subject<I>;
  private output: ObservableLike<O>;

  next(value: I): void {
    this.input.next(value);
  }
}
