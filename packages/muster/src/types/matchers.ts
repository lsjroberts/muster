export interface Matcher<T, P = any> {
  (value: any): boolean;
  metadata: MatcherMetadata<T, P>;
}

export interface MatcherFactory<T, P> {
  (options: P): Matcher<T, P>;
}

export interface MatcherMetadata<T, P = never> {
  name: string;
  type: Matcher<T, never> | MatcherFactory<T, P>;
  options: P;
}

export type ShapeFields<T> = { [key in keyof T]: Matcher<T[key], any> };
