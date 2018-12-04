import startCase from 'lodash/startCase';

export default function pascalCase(text: string): string {
  return startCase(text)
    .split(' ')
    .join('');
}
