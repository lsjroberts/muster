import {
  applyTransforms,
  container,
  endsWith,
  global,
  head,
  matchPattern,
  partial,
  propTypes,
  ref,
  regex,
  skip,
  types,
} from '@dws/muster-react';

export const ProfileContainer = container({
  graph: {
    follow: partial(ref(global('api', 'follow')), [ref('username')]),
    unfollow: partial(ref(global('api', 'unfollow')), [ref('username')]),
    username: head(applyTransforms(matchPattern(
      regex(/\/profile\/([^\/]*)/),
      ref(global('navigation', 'location', 'path'))
    ), [skip(1)])),
    profile: ref(global('api', 'profile', ref('username'))),
    showFavorites: endsWith(
      '/favorites',
      ref(global('navigation', 'location', 'path')),
    ),
  },
  props: {
    follow: propTypes.caller(),
    unfollow: propTypes.caller(),
    profile: {
      bio: types.optional(types.string),
      following: types.bool,
      image: types.optional(types.string),
      username: types.string,
    },
    showFavorites: types.bool,
  },
});
