import { ObservableLike } from './types';

import take from './take';

export default function toPromise<T>(stream: ObservableLike<T>): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    let isComplete = false;
    let isAsync = false;
    const subscription = take(1, stream).subscribe({
      next(value: T | undefined): void {
        resolve(value);
      },
      error(error: any): void {
        reject(error);
      },
      complete(): void {
        resolve();
        isComplete = true;
        if (isAsync) {
          subscription.unsubscribe();
        }
      },
    });
    if (isComplete) {
      subscription.unsubscribe();
    }
    isAsync = true;
  });
}
