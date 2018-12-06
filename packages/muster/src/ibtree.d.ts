declare module 'ibtree' {
  export class BTMap<K, V> {
    static from<K, V>(items: Array<[K, V]>): BTMap<K, V>;
    has(key: K): boolean;
    set(key: K, value: V): BTMap<K, V>;
    values(): Array<V>;
  }
  export class BTSet<T> {
    static from<T>(items: Array<T>): BTSet<T>;
    has(value: T): boolean;
    add(value: T): BTSet<T>;
    delete(value: T): BTSet<T>;
    values(): Array<T>;
  }
}
