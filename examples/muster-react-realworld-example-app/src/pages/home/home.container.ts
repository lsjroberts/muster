import {
  container,
  global,
  otherwise,
  property,
  propTypes,
  ref,
  switchOn,
  types,
  when,
} from '@dws/muster-react';
import {
  ArticlesListSource_Articles,
  ArticlesListSource_Feed,
} from '../../components/articles-list/articles-list.container';

export const HomeContainer = container({
  graph: {
    filterTag: property(ref(global('navigation', 'location', 'params')), 'tag'),
    isLoggedIn: ref(global('auth', 'isLoggedIn')),
    source: switchOn(ref(global('navigation', 'location', 'path')), [
      when('/feed', ArticlesListSource_Feed),
      otherwise(ArticlesListSource_Articles),
    ]),
    tags: ref(global('api', 'tags')),
  },
  props: {
    filterTag: types.optional(types.string),
    source: types.string,
    tags: propTypes.list(types.string),
  },
});
