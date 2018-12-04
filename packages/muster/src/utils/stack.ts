export interface Stack<T> {
  head: StackItem<T> | undefined;
  length: number;
}

export interface StackItem<T> {
  value: T;
  previous: StackItem<T> | undefined;
}

export function createStack<T>(): Stack<T> {
  return { head: undefined, length: 0 };
}

export function pushStackItem<T>(value: T, stack: Stack<T>): Stack<T> {
  return {
    head: { value, previous: stack.head },
    length: stack.length + 1,
  };
}

export function getStackItems<T>(stack: Stack<T>): Array<T> {
  // tslint:disable-next-line:prefer-array-literal
  const values: Array<T> = new Array(stack.length);
  let currentItem = stack.head;
  if (!currentItem) {
    return values;
  }
  let i = stack.length;
  do {
    // tslint:disable-next-line:no-increment-decrement
    values[--i] = currentItem.value;
  } while ((currentItem = currentItem.previous));
  return values;
}
