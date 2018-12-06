export function renderPlatformErrors(componentName: string, errors: Array<Error>): any {
  errors.forEach(console.error);
  return null;
}
