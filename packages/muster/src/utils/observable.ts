import { ObservableLike } from '@dws/muster-observable';

export function thenable<T>(stream: ObservableLike<T>): ObservableLike<T> & Promise<T> {
  return Object.assign(stream, {
    then<TResult1 = T, TResult2 = never>(
      onfulfilled?: ((value: T) => TResult1 | PromiseLike<TResult1>) | undefined | null,
      onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | undefined | null,
    ): Promise<TResult1 | TResult2> {
      return toPromise(stream).then(onfulfilled, onrejected);
    },
    catch<TResult = never>(
      onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | undefined | null,
    ): Promise<T | TResult> {
      return toPromise(stream).catch(onrejected);
    },
  }) as ObservableLike<T> & Promise<T>;

  function toPromise(stream: ObservableLike<T>): Promise<T> {
    return new Promise((resolve, reject) => {
      let isAsync: boolean = false;
      let isCompleted: boolean = false;
      let subscription = stream.subscribe((value) => {
        isCompleted = true;
        if (isAsync) {
          subscription.unsubscribe();
          subscription = undefined as any;
        }
        resolve(value);
      });
      if (isCompleted) {
        subscription.unsubscribe();
        subscription = undefined as any;
      }
      isAsync = true;
    });
  }
}
