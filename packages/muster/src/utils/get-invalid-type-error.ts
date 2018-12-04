import getType from './get-type';

export type InvalidTypeErrorOptions = {
  expected?: any | Array<any>;
  received: any;
};

export function getInvalidTypeError(message: string, options: InvalidTypeErrorOptions): Error {
  return new Error(getInvalidTypeErrorMessage(message, options));
}

export function getInvalidTypeErrorMessage(
  message: string,
  options: InvalidTypeErrorOptions,
): string {
  if (!('expected' in options)) {
    return [message, ' Received:', `  ${getType(options.received)}`].join('\n');
  }
  const expected = Array.isArray(options.expected) ? options.expected : [options.expected];
  return [
    message,
    ' Expected:',
    ...expected.map((type) => `  ${typeof type === 'string' ? type : getType(type)}`),
    ' Received:',
    `  ${getType(options.received)}`,
  ].join('\n');
}
