export function formatTime(time: number): string {
  return new Date(time).toLocaleTimeString();
}
