export default function memoizeLast<T, V>(
  fn: (arg: T) => V,
  eq?: (current: T, previous: T) => boolean,
): (arg: T) => V {
  const PENDING = {} as never;
  let previousArg: T = PENDING;
  let previousResult: V = undefined as never;
  return (arg: T): V =>
    (eq
    ? arg !== PENDING && eq(arg, previousArg)
    : arg === previousArg)
      ? previousResult
      : (previousResult = fn((previousArg = arg)));
}
