import { withDevTools } from '@dws/muster-devtools-client';
import { BehaviorSubject, Subscription } from '@dws/muster-observable';
import { parseNodeDefinition } from '@dws/muster-parser';
import muster, {
  action,
  call,
  computed,
  container,
  // @ts-ignore
  ContainerComponent,
  error,
  fromStream,
  location,
  Muster,
  NodeDefinition,
  propTypes,
  quote,
  QuoteNodeDefinition,
  ref,
  series,
  set,
  types,
  update,
  value,
  variable,
} from '@dws/muster-react';
import musterReactEval from './muster-react-eval';
import QueryEditor from './query-editor';

export const DEFAULT_GRAPH_DEFINITION = `{
  greeting: 'Hello',
  user: 'world',
  welcome: format('\${salutation}, \${name}!', {
    salutation: ref('greeting'),
    name: ref('user'),
  }),
}`;
export const DEFAULT_QUERY_DEFINITION = "ref('welcome')";
export const DEFAULT_CONTAINER_DEFINITION = `{
  graph: {
      welcome: ref(global('welcome'))
  },
  props: {
      welcome: types.string,
  }
}
`;
export const DEFAULT_VIEW = `({welcome, setWelcome}) => (
  <div>
      <div>{welcome}</div>
  </div>
)
`;

const DEFAULT_TOGGLES = {
  showGraph: true,
  showQuery: true,
  showQueryResult: true,
  showContainer: true,
  showView: true,
  showViewResult: true,
};

let musterInstance: Muster | undefined;
let querySubscription: Subscription | undefined;
const queryResultStream = new BehaviorSubject<NodeDefinition>(
  quote(value('Waiting for result...')),
);
const viewResultStream = new BehaviorSubject<any>({ container: null });

export default container({
  graph: {
    isInitialised: variable(false),
    history: location({ encoding: 'base64', update: true }),
    graphDefinition: variable(DEFAULT_GRAPH_DEFINITION),
    containerGraphDefinition: variable(DEFAULT_CONTAINER_DEFINITION),
    queryDefinition: variable(DEFAULT_QUERY_DEFINITION),
    viewDefinition: variable(DEFAULT_VIEW),
    parsedGraph: computed([ref('graphDefinition')], (source) => quote(parseNodeDefinition(source))),
    parsedQuery: computed([ref('queryDefinition')], (source) => quote(parseNodeDefinition(source))),
    toggles: variable(DEFAULT_TOGGLES),
    musterInstance: computed([ref('parsedGraph')], (parsedGraph: QuoteNodeDefinition) => {
      if (querySubscription) {
        querySubscription.unsubscribe();
        querySubscription = undefined;
      }
      if (musterInstance) {
        musterInstance.dispose();
      }
      musterInstance = withDevTools('Playground Graph', muster(parsedGraph.properties.node));
      return musterInstance;
    }),
    setGraph: action((graph) =>
      series([
        update(['history', 'params'], action((prevParams) => ({ ...prevParams, graph }))),
        set('graphDefinition', graph),
      ]),
    ),
    setContainerGraph: action((containerGraph) =>
      series([
        update(
          ['history', 'params'],
          action((prevParams) => ({
            ...prevParams,
            containerGraph,
          })),
        ),
        set('containerGraphDefinition', containerGraph),
      ]),
    ),
    setQuery: action((queryDefinition) =>
      series([
        update(
          ['history', 'params'],
          action((prevParams) => ({
            ...prevParams,
            query: queryDefinition,
          })),
        ),
        set('queryDefinition', queryDefinition),
      ]),
    ),
    setToggles: action((toggles) =>
      series([
        update(
          ['history', 'params'],
          action((prevParams) => ({
            ...prevParams,
            toggles,
          })),
        ),
        set('toggles', toggles),
      ]),
    ),
    setView: action((viewDefinition) =>
      series([
        update(
          ['history', 'params'],
          action((prevParams) => ({
            ...prevParams,
            view: viewDefinition,
          })),
        ),
        set('viewDefinition', viewDefinition),
      ]),
    ),
    initialise: action(function*() {
      if (yield ref('isInitialised')) return;
      yield [set('isInitialised', true), call('loadStateFromHistory')];
    }),
    loadStateFromHistory: action(function*() {
      const params = yield ref('history', 'params');
      const updates: Array<NodeDefinition> = [];
      if (params.graph) {
        updates.push(set('graphDefinition', params.graph));
      }
      if (params.containerGraph) {
        updates.push(set('containerGraphDefinition', params.containerGraph));
      }
      if (params.query) {
        updates.push(set('queryDefinition', params.query));
      }
      if (params.toggles) {
        updates.push(set('toggles', params.toggles));
      }
      if (params.view) {
        updates.push(set('viewDefinition', params.view));
      }
      if (updates.length > 0) {
        yield updates;
      }
    }),
    result: computed(
      [ref('musterInstance'), ref('parsedQuery')],
      (musterInstance: Muster, parsedQuery: QuoteNodeDefinition) => {
        if (querySubscription) {
          querySubscription.unsubscribe();
          querySubscription = undefined;
        }
        queryResultStream.next(quote(value('Waiting for result...')));
        try {
          querySubscription = musterInstance
            .resolve(parsedQuery.properties.node, { raw: true })
            .subscribe((result) => queryResultStream.next(quote(result)));
        } catch (ex) {
          queryResultStream.next(quote(error(ex)));
        }
        return fromStream(queryResultStream);
      },
    ),
    viewResult: computed(
      [ref('musterInstance'), ref('containerGraphDefinition'), ref('viewDefinition')],
      (musterInstance: Muster, containerGraphDefinition: string, viewDefinition: string) => {
        viewResultStream.next({
          container: musterReactEval(musterInstance, containerGraphDefinition, viewDefinition),
        });
        return fromStream(viewResultStream);
      },
    ),
  },
  props: {
    graphDefinition: types.any,
    queryDefinition: types.any,
    containerGraphDefinition: types.any,
    viewDefinition: types.any,
    result: types.any,
    viewResult: types.any,
    toggles: types.any,
    setGraph: propTypes.caller(),
    setContainerGraph: propTypes.caller(),
    setQuery: propTypes.caller(),
    setView: propTypes.caller(),
    setToggles: propTypes.caller(),
    initialise: propTypes.caller(),
  },
})(QueryEditor);
