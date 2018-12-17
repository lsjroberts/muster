import {
  action,
  computed,
  createModule,
  eq,
  error,
  fn,
  fromPromise,
  ifElse,
  invalidate,
  match,
  nil,
  NodeDefinition,
  not,
  ref,
  series,
  set,
  toNode,
  types,
  value,
} from '@dws/muster';

const API_URL = 'https://conduit.productionready.io/api';

export const api = createModule(
  {
    jwtToken: true,
  },
  ({ jwtToken }) => ({
    article: {
      [match(types.string, 'slug')]: computed([jwtToken], (token) =>
        fromPromise(({ slug }) =>
          fetch(`${API_URL}/articles/${slug}`, {
            headers: {
              'Accept': 'application/json',
              'Authorization': `Token ${token}`,
            },
          }).then(async (response) => {
            const result = await response.json();
            if (!response.ok) {
              return error(`Could not get article '${slug}'.`, {
                data: result,
              });
            }
            return toNode(result.article);
          }),
        ),
      ),
    },
    createArticle: action(function* ({
      body,
      description,
      tags,
      title,
    }) {
      const token = yield jwtToken;
      return fromPromise(() =>
        fetch(`${API_URL}/articles`, {
          method: 'POST',
          headers: {
            'Accept': 'application/json',
            'Authorization': `Token ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            article: {
              title,
              description,
              body,
              tagList: (tags || '').split(' '),
            },
          }),
        }).then(async (response) => {
          const result = await response.json();
          if (!response.ok) {
            return error('Could not create a new article.', {
              data: result.errors,
            });
          }
          return value(result.article.slug);
        }),
      );
    }),
    updateArticle: action(function* ({
      body,
      description,
      slug,
      title,
    }) {
      const token = yield jwtToken;
      return fromPromise(() =>
        fetch(`${API_URL}/articles/${slug}`, {
          method: 'PUT',
          headers: {
            'Accept': 'application/json',
            'Authorization': `Token ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            article: {
              title,
              description,
              body,
            },
          }),
        }).then(async (response) => {
          const result = await response.json();
          if (!response.ok) {
            return error(`Could not update article '${slug}'.`, {
              data: result.errors,
            });
          }
          return value(result.article.slug);
        }),
      );
    }),
    deleteArticle: action(function*(slug) {
      const token = yield jwtToken;
      return fromPromise(() =>
        fetch(`${API_URL}/articles/${slug}`, {
          method: 'DELETE',
          headers: {
            'Accept': 'application/json',
            'Authorization': `Token ${token}`,
          },
        }).then(async (response) => {
          const result = await response.json();
          if (!response.ok) {
            return error(`Could not delete article '${slug}'.`, {
              data: result,
            });
          }
          return value(true);
        }),
      );
    }),
    comments: {
      [match(types.string, 'slug')]: computed([jwtToken], (token) =>
        fromPromise(({ slug }) =>
          fetch(`${API_URL}/articles/${slug}/comments`, {
            headers: {
              'Accept': 'application/json',
              'Authorization': `Token ${token}`,
            },
          }).then(async (response) => {
            const result = await response.json();
            if (!response.ok) {
              return error(`Could not get comments for article '${slug}'.`, {
                data: result,
              });
            }
            return toNode(result.comments);
          }),
        ),
      ),
    },
    addComment: action(function*(slug, body) {
      const token = yield jwtToken;
      return fromPromise(() =>
        fetch(`${API_URL}/articles/${slug}/comments`, {
          method: 'POST',
          headers: {
            'Accept': 'application/json',
            'Authorization': `Token ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            comment: { body },
          }),
        }).then(async (response) => {
          const result = await response.json();
          if (!response.ok) {
            return error(`Could not add a comment to article '${slug}'.`, {
              data: result,
            });
          }
          return invalidate(ref('comments', slug));
        }),
      );
    }),
    deleteComment: action(function*(slug, commentId) {
      const token = yield jwtToken;
      return fromPromise(() =>
        fetch(`${API_URL}/articles/${slug}/comments/${commentId}`, {
          method: 'DELETE',
          headers:  {
            'Accept': 'application/json',
            'Authorization': `Token ${token}`,
          },
        }).then(async (response) => {
          const result = await response.json();
          if (!response.ok) {
            return error(`Could not delete a comment '${commentId}' from article '${commentId}'.`, {
              data: result,
            });
          }
          return invalidate(ref('comments', slug));
        }),
      );
    }),
    articles: {
      [match(types.shape({
        author: types.optional(types.string),
        favorited: types.optional(types.string),
        tag: types.optional(types.string),
        limit: types.number,
        offset: types.number,
      }), 'filters')]: getArticlesComputed(jwtToken),
    },
    favorite: action(function*(slug) {
      const token = yield jwtToken;
      return fromPromise(() =>
        fetch(`${API_URL}/articles/${slug}/favorite`, {
          method: 'POST',
          headers:  {
            'Accept': 'application/json',
            'Authorization': `Token ${token}`,
          },
        }).then(() => series([
          invalidate(ref('articles')),
          invalidate(ref('article')),
        ])),
      );
    }),
    unfavorite: action(function*(slug) {
      const token = yield jwtToken;
      return fromPromise(() =>
        fetch(`${API_URL}/articles/${slug}/favorite`, {
          method: 'DELETE',
          headers:  {
            'Accept': 'application/json',
            'Authorization': `Token ${token}`,
          },
        }).then(() => series([
          invalidate(ref('articles')),
          invalidate(ref('article')),
        ])),
      );
    }),
    feed: {
      [match(types.shape({
        limit: types.number,
        offset: types.number,
      }), 'filters')]: computed([jwtToken], (token) =>
        fromPromise((params) =>
          fetch(getArticlesFeedUrl(params.filters), {
            headers: {
              'Accept': 'application/json',
              'Authorization': `Token ${token}`,
            },
          }).then(async (response) => {
            const result = await response.json();
            if (!response.ok) {
              return error('Could not get article feed', {
                data: result,
              });
            }
            return toNode(result);
          }),
        ),
      ),
    },
    tags: fromPromise(() =>
      fetch(`${API_URL}/tags`)
        .then(async (response) => {
          const result = await response.json();
          if (!response.ok) {
            return error('Could not get tags.', {
              data: result,
            });
          }
          return toNode(result.tags);
        })
    ),
    profile: {
      [match(types.string, 'username')]: computed([jwtToken], (token) =>
        fromPromise(({ username }) =>
          fetch(`${API_URL}/profiles/${username}`, {
            headers: {
              'Accept': 'application/json',
              'Authorization': `Token ${token}`,
            },
          }).then(async (response) => {
            const result = await response.json();
            if (!response.ok) {
              return error(`Could not get profile '${username}'.`, {
                data: response,
              });
            }
            return toNode(result.profile);
          }),
        ),
      ),
    },
    follow: action(function*(username) {
      const token = yield jwtToken;
      return fromPromise(() =>
        fetch(`${API_URL}/profiles/${username}/follow`, {
          method: 'POST',
          headers:  {
            'Accept': 'application/json',
            'Authorization': `Token ${token}`,
          },
        }).then(() => series([
          invalidate(ref('profile', username)),
          invalidate(ref('article')),
        ])),
      );
    }),
    unfollow: action(function*(username) {
      const token = yield jwtToken;
      return fromPromise(() =>
        fetch(`${API_URL}/profiles/${username}/follow`, {
          method: 'DELETE',
          headers:  {
            'Accept': 'application/json',
            'Authorization': `Token ${token}`,
          },
        }).then(() => series([
          invalidate(ref('profile', username)),
          invalidate(ref('article')),
        ])),
      );
    }),
    user: ifElse({
      if: not(eq(jwtToken, undefined)),
      then: computed([jwtToken], (token) =>
        fromPromise(() =>
          fetch(`${API_URL}/user`, {
            headers: {
              'Accept': 'application/json',
              'Authorization': `Token ${token}`,
            },
          }).then(async (response) => {
            if (!response.ok) {
              return series([
                set(jwtToken, undefined),
                nil(),
              ]);
            }
            const result = await response.json();
            return toNode(result.user);
          }),
        )
      ),
      else: nil(),
    }),
    login: action(function* ({ email, password }) {
      const token = yield fromPromise(() =>
        fetch(`${API_URL}/users/login`, {
          method: 'POST',
          headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            user: {
              email,
              password,
            },
          }),
        }).then(async (response) => {
          const result = await response.json();
          if (!response.ok) {
            return series([
              set(jwtToken, undefined),
              error('Login failed.', {
                data: result.errors,
              }),
            ]);
          }
          return result.user.token;
        })
      );
      yield set(jwtToken, token);
    }),
    logout: fn(() => series([
      set(jwtToken, undefined),
    ])),
    signUp: action(function *({ userName, email, password }) {
      const token = yield fromPromise(() =>
        fetch(`${API_URL}/users`, {
          method: 'POST',
          headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            user: {
              username: userName,
              email,
              password,
            },
          }),
        }).then(async (response) => {
          const result = await response.json();
          if (!response.ok) {
            return series([
              set(jwtToken, undefined),
              error('Registration failed.', {
                data: result.errors,
              }),
            ]);
          }
          return result.user.token;
        })
      );
      yield set(jwtToken, token);
    }),
    updateUser: action(function *({ bio, email, image, username, password }) {
      const token = yield jwtToken;
      yield fromPromise(() =>
        fetch(`${API_URL}/user`, {
          method: 'PUT',
          headers: {
            'Action': 'application/json',
            'Authorization': `Token ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            user: {
              bio,
              email,
              image,
              username,
              password,
            },
          }),
        }).then(async (response) => {
          const result = await response.json();
          if (!response.ok) {
            return error('Update user failed.', {
              data: result.errors,
            });
          }
          return invalidate(ref('user'));
        }),
      );
    }),
  }),
);

function getArticlesComputed(jwtToken: NodeDefinition): NodeDefinition {
  return computed([jwtToken], (token) =>
    fromPromise(({ filters }) =>
      fetch(getArticlesUrl(filters), {
        headers: {
          ...token ? { 'Authorization': `Token ${token}` } : {},
          'Accept': 'application/json',
        },
      }).then(async (response) => {
        const result = await response.json();
        if (!response.ok) {
          return error('A request to get articles has failed.', {
            data: result.errors,
          });
        }
        return toNode(result);
      }),
    ),
  );
}

interface ArticlesFilters {
  author: string | undefined;
  favorited: string | undefined;
  tag: string | undefined;
  limit: number;
  offset: number;
}

function getArticlesUrl(filters: ArticlesFilters): string {
  const params: Array<string> = [];
  if (filters.author) {
    params.push(`author=${encodeURIComponent(filters.author)}`);
  } else if (filters.favorited) {
    params.push(`favorited=${encodeURIComponent(filters.favorited)}`);
  } else if (filters.tag) {
    params.push(`tag=${encodeURIComponent(filters.tag)}`)
  }
  const paramsString = params.length ? `&${params.join('&')}` : '';
  return `${API_URL}/articles?limit=${filters.limit}&offset=${filters.offset}${paramsString}`;
}

interface ArticlesFeedFilters {
  limit: number;
  offset: number;
}

function getArticlesFeedUrl(filters: ArticlesFeedFilters): string {
  return `${API_URL}/articles/feed?limit${filters.limit}&offset=${filters.offset}`;
}
