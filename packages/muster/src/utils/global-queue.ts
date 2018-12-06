export const { unshift, push } = (() => {
  type StackFrame<T> = () => T;
  const queue = [] as Array<StackFrame<any>>;
  let isProcessing = false;
  return {
    unshift<T>(fn: StackFrame<T>, callback?: (value: T) => void): void {
      queue.unshift(fn);
      flush();
    },
    push<T>(fn: StackFrame<T>, callback?: (value: T) => void): void {
      queue.push(fn);
      flush();
    },
  };

  function flush() {
    if (isProcessing) {
      return;
    }
    isProcessing = true;
    while (queue.length > 0) {
      const fn = queue.shift()!;
      fn();
    }
    isProcessing = false;
  }
})();
