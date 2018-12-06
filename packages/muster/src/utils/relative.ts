import { parent } from '../nodes/graph/parent';
import { NodeLike } from '../types/graph';
import { deprecated } from './deprecated';
import { RootAndPath } from './ref';

const showRelativeArrayDeprecationWarning = deprecated({
  old: 'relative([...])',
  new: 'relative(...)',
});

export default function relative(...path: Array<NodeLike | Array<NodeLike>>): RootAndPath {
  if (path.length === 0) {
    throw new Error('Path must not be empty.');
  }
  if (path.length === 1 && Array.isArray(path[0])) {
    if (path[0].length === 0) {
      throw new Error('Path must not be empty.');
    }
    showRelativeArrayDeprecationWarning();
    return { root: parent(), path: path[0] };
  }
  return { root: parent(), path };
}
