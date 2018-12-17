import {
  applyTransforms,
  arrayList,
  call,
  clear,
  container,
  ErrorNodeDefinition,
  extend,
  flow,
  fn,
  format,
  global,
  head,
  ifElse,
  ifError,
  isNil,
  joinItems,
  matchPattern,
  nil,
  not,
  propTypes,
  push,
  ref,
  regex,
  series,
  setResult,
  skip,
  types,
} from '@dws/muster-react';
import { editable } from '../../utils/editable';
import { getApiErrors } from '../../utils/get-api-errors';

export const EditorContainer = container({
  graph: {
    article: {
      ...editable(ref('originalArticle'), 'body'),
      ...editable(ref('originalArticle'), 'description'),
      ...editable(ref('originalArticle'), 'tags'),
      ...editable(ref('originalArticle'), 'title'),
    },
    errors: arrayList([]),
    isEditing: not(isNil(ref('slug'))),
    originalArticle: ifElse({
      if: ref('isEditing'),
      then: extend(
        ref(global('api', 'article', ref('slug'))),
        {
          tags: joinItems(' ', ref('originalArticle', 'tagList')),
        },
      ),
      else: nil(),
    }),
    slug: head(applyTransforms(matchPattern(
      regex(/\/editor\/(.*)/),
      ref(global('navigation', 'location', 'path'))
    ), [skip(1)])),
    publish: ifError(
      (error: ErrorNodeDefinition) => {
        const errors = getApiErrors(error);
        return series(errors.map((error) => push(ref('errors'), error)));
      },
      flow(
        fn(() => clear(ref('errors'))),
        ifElse({
          if: ref('isEditing'),
          then: fn(() => call(ref(global('api', 'updateArticle')), {
            body: ref('article', 'body'),
            description: ref('article', 'description'),
            slug: ref('slug'),
            title: ref('article', 'title'),
          })),
          else: fn(() => call(ref(global('api', 'createArticle')), {
            body: ref('article', 'body'),
            description: ref('article', 'description'),
            tags: ref('article', 'tags'),
            title: ref('article', 'title'),
          }))
        }),
        fn((slug) => setResult(
          ref(global('navigation', 'location', 'path')),
          format('/article/${slug}', { slug }),
        )),
      ),
    ),
  },
  props: {
    article: {
      body: types.optional(types.string),
      description: types.optional(types.string),
      tags: types.optional(types.string),
      title: types.optional(types.string),
      setBody: propTypes.setter('body', types.string),
      setDescription: propTypes.setter('description', types.string),
      setTags: propTypes.setter('tags', types.string),
      setTitle: propTypes.setter('title', types.string),
    },
    errors: propTypes.list(),
    isEditing: types.bool,
    originalArticle: {
      tagList: propTypes.list(),
    },
    publish: propTypes.caller(),
  },
});
