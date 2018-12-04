import {
  action,
  arrayList,
  container,
  entries,
  get,
  getType,
  global,
  ifPending,
  map,
  match,
  NodeDefinition,
  propTypes,
  push,
  query,
  ref,
  relative,
  removeItemAt,
  resolve,
  toNode,
  types,
  value,
  variable,
  withTransforms,
} from '@dws/muster-react';

let nextWatchId = 1;
function getNextWatchId() {
  const watchId = nextWatchId;
  nextWatchId += 1;
  return watchId;
}

export const WatchesContainer = container({
  graph: {
    addWatch: action(function*(query: string) {
      const instanceId = yield ref(global('selectedInstanceId'));
      yield push(
        ref('watches'),
        toNode({
          id: getNextWatchId(),
          isEditing: variable(false),
          query: variable(query),
          value: ifPending(
            () => value('Loading...'),
            resolve(
              [
                {
                  target: ref(global('client', instanceId, 'watch', ref(relative('query')))),
                  allowErrors: true,
                },
              ],
              ([result]) => value(getType(result.definition)),
            ),
          ),
        }),
      );
    }),
    allWatches: {
      [match(types.string, 'instanceId')]: arrayList([]),
    },
    deleteWatch: action(function*(id: number) {
      // TODO: Re-implement this once we get a node that's able to delete an item that matches a predicate
      const watchesIds: Array<number> = yield query(
        ref('watches'),
        withTransforms([map((item: NodeDefinition) => get(item, 'id'))], entries()),
      );
      const watchIndex = watchesIds.indexOf(id);
      if (watchIndex === -1) {
        console.warn('Delete watch failed: Could not find watch with id:', id);
        return;
      }
      yield removeItemAt(ref('watches'), watchIndex);
    }),
    watches: ref('allWatches', ref(global('selectedInstanceId'))),
  },
  props: {
    addWatch: propTypes.caller(),
    deleteWatch: propTypes.caller(),
    watches: propTypes.list({
      id: types.number,
      isEditing: types.bool,
      query: types.string,
      setIsEditing: propTypes.setter('isEditing', types.bool),
      setQuery: propTypes.setter('query', types.string),
      value: types.string,
    }),
  },
});
