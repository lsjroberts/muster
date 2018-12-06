import {
  GraphOperation,
  isCallOperation,
  isGetChildOperation,
  isGetItemsOperation,
  isSetOperation,
  NodeDefinition,
  querySet,
  querySetCallOperation,
  QuerySetChild,
  querySetGetChildOperation,
  querySetGetItemsOperation,
  querySetOperation,
  querySetSetOperation,
  root,
} from '@dws/muster';

export function pathToQuerySet(path: Array<GraphOperation>): NodeDefinition {
  return querySet(root(), pathToQuerySetChildren(path));
}

function pathToQuerySetChildren(path: Array<GraphOperation>): Array<QuerySetChild> {
  if (path.length === 0) return [];
  const [part, ...rest] = path;
  if (isGetChildOperation(part)) {
    return [querySetGetChildOperation(part, pathToQuerySetChildren(rest))];
  }
  if (isGetItemsOperation(part)) {
    return [
      querySetGetItemsOperation({
        children: pathToQuerySetChildren(rest),
        operation: part,
      }),
    ];
  }
  if (isCallOperation(part)) {
    return [querySetCallOperation(part)];
  }
  if (isSetOperation(part)) {
    return [querySetSetOperation(part)];
  }
  return [querySetOperation(part, pathToQuerySetChildren(rest))];
}
