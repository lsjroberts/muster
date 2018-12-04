import { ChildKey } from '../types/graph';
import getType from './get-type';

/**
 * A helper function used when formatting a path array to a human-readable format.
 * @param {Array<ChildKey>} path
 * @returns {string}
 */
export default function formatPath(path: Array<ChildKey>): string {
  return `[${path.map((key) => getType(key)).join(',')}]`;
}
