/**
 * Remove the variants of the second union of string literals from
 * the first.
 *
 * @see https://github.com/Microsoft/TypeScript/issues/12215#issuecomment-307871458
 */
declare type Diff<T extends string | symbol | number, U extends string | symbol | number> = ({
  [P in T]: P
} &
  { [P in U]: never } & { [x: string]: never })[T];

/**
 * Drop keys `K` from `T`.
 *
 * @see https://github.com/Microsoft/TypeScript/issues/12215#issuecomment-307871458
 */
declare type Omit<T, K extends keyof T> = Pick<T, Diff<keyof T, K>>;

declare module '*.json' {
  const value: any;
  export default value;
}
