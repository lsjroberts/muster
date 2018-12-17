import classNames from 'classnames';
import React from 'react';
import ReactMarkdown from 'react-markdown';
import { Comments } from '../../components/comments';
import { formatDate } from '../../utils/format-date';

export interface ArticleViewProps {
  article: {
    author: {
      bio: string;
      following: boolean;
      image: string;
      username: string;
    };
    body: string;
    createdAt: string;
    description: string;
    favorited: boolean;
    favoritesCount: number;
    slug: string;
    tagList: Array<string>;
    title: string;
    updatedAt: string;
  };
  deleteArticle: () => void;
  favorite: (slug: string) => void;
  unfavorite: (slug: string) => void;
  follow: (username: string) => void;
  unfollow: (username: string) => void;
  isLoggedIn: boolean;
  username: string;
}

export function ArticleView(props: ArticleViewProps) {
  const { article } = props;
  if (!article) return null;
  return (
    <div className="article-page">

      <div className="banner">
        <div className="container">
          <h1>{article.title}</h1>
          <ArticleMeta {...props} />
        </div>
      </div>

      <div className="container page">
        <div className="row article-content">
          <div className="col-md-12">
            <p>{article.description}</p>
            <ReactMarkdown source={article.body}/>
          </div>
        </div>

        <hr/>

        <div className="article-actions">
          <ArticleMeta {...props} />
        </div>

        <Comments slug={article.slug} />
      </div>

    </div>
  );
}

function ArticleMeta(props: ArticleViewProps) {
  const { article } = props;
  const { author } = article;
  const isOwner = author.username === props.username;
  return (
    <div className="article-meta">
      <a href={`#/profile/${author.username}`}>
        {author.image && <img src={author.image}/>}
      </a>
      <div className="info">
        <a href={`#/profile/${author.username}`} className="author">
          {author.username}
        </a>
        <span className="date">{formatDate(article.createdAt)}</span>
      </div>

      {/* Owner section */}
      {isOwner && <a
        className="btn btn-sm btn-outline-secondary"
        href={`#/editor/${article.slug}`}
      >
        Edit Article
      </a>}
      &nbsp;
      &nbsp;
      {isOwner && <button
        className="btn btn-sm btn-outline-danger"
        onClick={props.deleteArticle}
      >
        Delete Article
      </button>}

      {/* Regular user section */}
      {props.isLoggedIn && !isOwner && <button
        className={classNames('btn btn-sm', {
          'btn-outline-secondary': !author.following,
          'btn-secondary': author.following,
        })}
        onClick={() => author.following ? props.unfollow(author.username) : props.follow(author.username)}
      >
        <i className={classNames({
          'ion-minus-round': author.following,
          'ion-plus-round': !author.following,
        })}></i>
        &nbsp;
        {author.following ? 'Unfollow' : 'Follow'} {author.username}
      </button>}
      &nbsp;&nbsp;
      {props.isLoggedIn && !isOwner && <button
        className={classNames('btn btn-sm', {
          'btn-outline-primary': !article.favorited,
          'btn-primary': article.favorited,
        })}
        onClick={() => article.favorited ? props.unfavorite(article.slug) : props.favorite(article.slug)}
      >
        <i className="ion-heart"></i>
        &nbsp;
        {article.favorited ? 'Unfavorite' : 'Favorite'} Post <span
        className="counter">({article.favoritesCount})</span>
      </button>}
    </div>
  );
}
