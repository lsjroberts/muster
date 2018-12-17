import {
  applyTransforms,
  call,
  container,
  fn,
  global,
  head,
  matchPattern,
  propTypes,
  ref,
  regex,
  series,
  set,
  skip,
  types,
} from '@dws/muster-react';

export const ArticleContainer = container({
  graph: {
    article: ref(global('api', 'article', ref('slug'))),
    deleteArticle: fn(() => series([
      call(ref(global('api', 'deleteArticle')), [ref('slug')]),
      set(ref(global('navigation', 'location')), { path: '/' }),
    ])),
    favorite: ref(global('api', 'favorite')),
    unfavorite: ref(global('api', 'unfavorite')),
    follow: ref(global('api', 'follow')),
    unfollow: ref(global('api', 'unfollow')),
    isLoggedIn: ref(global('auth', 'isLoggedIn')),
    slug: head(applyTransforms(matchPattern(
      regex(/\/article\/(.*)/),
      ref(global('navigation', 'location', 'path'))
    ), [skip(1)])),
    username: ref(global('api', 'user', 'username')),
  },
  props: {
    article: propTypes.defer({
      author: {
        bio: types.optional(types.string),
        following: types.bool,
        image: types.optional(types.string),
        username: types.string,
      },
      body: types.string,
      createdAt: types.string,
      description: types.string,
      favorited: types.bool,
      favoritesCount: types.number,
      slug: types.string,
      tagList: propTypes.list(types.string),
      title: types.string,
      updatedAt: types.string,
    }),
    deleteArticle: propTypes.caller(),
    favorite: propTypes.caller([types.string]),
    unfavorite: propTypes.caller([types.string]),
    follow: propTypes.caller([types.string]),
    unfollow: propTypes.caller([types.string]),
    isLoggedIn: types.bool,
    username: types.optional(types.string),
  },
});
