const chalk = require('chalk');
const highlight = require('cli-highlight').highlight;

export function formatCode(input: any): string {
  return highlight(input.toString(), {
    language: 'javascript',
    ignoreIllegals: true,
  });
}

export function formatString(input: any): string {
  return chalk.green((input || '').toString());
}

export function formatError(input: any): string {
  return chalk.red((input || '').toString());
}
