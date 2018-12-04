import { DisposeCallback } from '@dws/muster';

export type DisposeListener = () => void;

export interface DisposeEmitter {
  (listener: DisposeListener): DisposeCallback;
  dispose(): void;
}

export function createDisposeEmitter(): DisposeEmitter {
  const listeners: Array<DisposeListener> = [];
  return Object.assign(
    (listener: DisposeListener) => {
      listeners.push(listener);
      return () => {
        const listenerIndex = listeners.indexOf(listener);
        if (listenerIndex === -1) return;
        listeners.splice(listenerIndex, 1);
      };
    },
    {
      dispose: () => {
        listeners.forEach((listener) => listener());
      },
    },
  );
}
