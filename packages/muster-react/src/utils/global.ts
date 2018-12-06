import { deprecated, NodeLike, RootAndPath, toValue } from '@dws/muster';
import { globalRoot } from '../nodes/global-root';

const showGlobalArrayDeprecationWarning = deprecated({ old: 'global([...])', new: 'global(...)' });

export default function global(...path: Array<NodeLike>): RootAndPath;
export default function global(path: Array<NodeLike>): RootAndPath;
export default function global(...path: Array<NodeLike | Array<NodeLike>>): RootAndPath {
  if (path.length === 1 && Array.isArray(path[0])) {
    showGlobalArrayDeprecationWarning();
  }
  return {
    root: globalRoot(),
    path: Array.isArray(path[0]) ? path[0].map(toValue) : path.map(toValue),
  };
}
