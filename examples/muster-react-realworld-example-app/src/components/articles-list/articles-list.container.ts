import {
  action,
  ceil,
  computed,
  container,
  createBehavior,
  divide,
  global,
  prop,
  property,
  propTypes,
  ref,
  SetProperties,
  types,
  update,
  valueOf,
  variable,
} from '@dws/muster-react';

export const ArticlesListSource_Articles = 'articles';
export const ArticlesListSource_Feed = 'feed';

export interface ArticlesListExternalProps {
  author?: string;
  favorited?: string;
  tag?: string;
  source: string;
}

export const ArticlesListContainer = container({
  graph: {
    favorite: ref(global('api', 'favorite')),
    unfavorite: ref(global('api', 'unfavorite')),
    pageCount: ceil(divide(ref('filteredArticles', 'articlesCount'), ref('pageSize'))),
    pageIndex: createBehavior({
      evaluate: () => computed(
        [property(ref(global('navigation', 'location', 'params')), 'page')],
        (page) => parseInt(page || 0),
      ),
      set: (params, value: SetProperties) => update(
        ref(global('navigation', 'location', 'params')),
        action((params) => ({ ...params, page: valueOf(value.value) })),
      ),
    }),
    pageSize: variable(20),
    filteredArticles: computed(
      [
        ref('pageIndex'),
        ref('pageSize'),
        prop('author'),
        prop('favorited'),
        prop('tag'),
      ],
      (pageIndex, pageSize, author, favorited, tag) => (
        ref(global('api', prop('source'), {
          author,
          favorited,
          tag,
          limit: pageSize,
          offset: pageIndex * pageSize,
        }))
      ),
    ),
    articles: ref('filteredArticles', 'articles'),
  },
  props: {
    articles: propTypes.defer(propTypes.list({
      slug: types.string,
      title: true,
      description: true,
      tagList: propTypes.list(types.string),
      createdAt: true,
      favorited: true,
      favoritesCount: true,
      author: {
        username: true,
        image: true,
      },
    })),
    favorite: propTypes.caller([types.string]),
    unfavorite: propTypes.caller([types.string]),
    pageCount: propTypes.defer(types.number),
    pageIndex: types.number,
    pageSize: types.number,
    setPageIndex: propTypes.setter('pageIndex', types.number),
  },
});
