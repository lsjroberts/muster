export default function formatBytes(value: number, options?: { precision?: number }): string {
  const { precision = 2 } = options || {};
  const { value: formattedValue, unit } = ['KB', 'MB', 'GB'].reduce(
    (acc, nextUnit) => (acc.value >= 1024 ? { value: acc.value / 1024, unit: nextUnit } : acc),
    { value, unit: undefined },
  );
  if (!unit) {
    return `${value} bytes`;
  }
  return `${formattedValue.toFixed(precision)} ${unit}`;
}
