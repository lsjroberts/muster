import once from 'lodash/once';

export function deprecated(options: { old: string; new: string }): (() => void) {
  const { old, new: updated } = options;
  return once(() => {
    console.warn(`[DEPRECATED] '${old}' is deprecated. Please use '${updated}' instead.`);
  });
}
