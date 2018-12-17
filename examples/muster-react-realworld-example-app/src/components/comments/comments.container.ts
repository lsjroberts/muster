import {
  call,
  container,
  fn,
  global,
  partial,
  prop,
  propTypes,
  ref,
  reset,
  series,
  types,
  variable,
} from '@dws/muster-react';

export interface CommentsExternalProps {
  slug: string;
}

export const CommentsContainer = container({
  graph: {
    addComment: fn(() => series([
      call(ref(global('api', 'addComment')), [prop('slug'), ref('commentBody')]),
      reset(ref('commentBody')),
    ])),
    commentBody: variable(''),
    comments: ref(global('api', 'comments', prop('slug'))),
    deleteComment: partial(ref(global('api', 'deleteComment')), [prop('slug')]),
    isLoggedIn: ref(global('auth', 'isLoggedIn')),
    user: ref(global('api', 'user')),
  },
  props: {
    addComment: propTypes.caller(),
    commentBody: types.string,
    setCommentBody: propTypes.setter('commentBody', types.string),
    comments: propTypes.defer(propTypes.list({
      id: types.number,
      createdAt: types.string,
      updatedAt: types.string,
      body: types.string,
      author: {
        username: types.string,
        bio: types.optional(types.string),
        image: types.optional(types.string),
        following: types.bool,
      },
    })),
    deleteComment: propTypes.caller([types.number]),
    isLoggedIn: types.bool,
    user: {
      image: types.optional(types.string),
      username: types.optional(types.string),
    },
  },
});
