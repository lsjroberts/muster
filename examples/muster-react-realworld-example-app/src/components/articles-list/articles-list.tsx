import classNames from 'classnames';
import React from 'react';
import { formatDate } from '../../utils/format-date';

export interface ArticlesListViewProps {
  articles: Array<{
    slug: string;
    title: string;
    description: string;
    tagList: Array<string>;
    createdAt: string;
    favorited: boolean;
    favoritesCount: number;
    author: {
      username: string;
      image: string;
    },
  }>;
  favorite: (slug: string) => void;
  unfavorite: (slug: string) => void;
  pageCount: number;
  pageIndex: number;
  pageSize: number;
  setPageIndex: (value: number) => void;
}

export function ArticlesListView(props: ArticlesListViewProps) {
  return (
    <React.Fragment>
      {props.articles.length === 0 && (
        <div className="article-preview">
          <p>No articles are here... yet.</p>
        </div>
      )}

      {props.articles.map((article) => (
        <div className="article-preview" key={article.slug}>
          <div className="article-meta">
            <a href={`#/profile/${article.author.username}`}>
              {article.author.image && <img src={article.author.image} />}
            </a>
            <div className="info">
              <a href={`#/profile/${article.author.username}`} className="author">{article.author.username}</a>
              <span className="date">{formatDate(article.createdAt)}</span>
            </div>
            <button
              className={classNames('btn btn-sm pull-xs-right', {
                'btn-outline-primary': !article.favorited,
                'btn-primary': article.favorited,
              })}
              onClick={() => (article.favorited ? props.unfavorite : props.favorite)(article.slug)}
            >
              <i className="ion-heart"></i> {article.favoritesCount}
            </button>
          </div>
          <a href={`#/article/${article.slug}`} className="preview-link">
            <h1>{article.title}</h1>
            <p>{article.description}</p>
            <span>Read more...</span>
            {article.tagList.length > 0 && (
              <ul className="tag-list">
                {article.tagList.map((tag) => (
                  <li key={tag} className="tag-default tag-pill tag-outline">{tag}</li>
                ))}
              </ul>
            )}
          </a>
        </div>
      ))}

      {props.pageCount > 1 && <nav>
        <ul className="pagination">
          {renderPagination(props)}
        </ul>
      </nav>}
    </React.Fragment>
  )
}

function renderPagination(props: ArticlesListViewProps): Array<JSX.Element> {
  const buttons = [];
  for (let index = 0; index < props.pageCount; index += 1) {
    buttons.push(
      <li key={`page-${index}`} className={classNames('page-item', {
        active: props.pageIndex === index,
      })}>
        <a className="page-link" href="" onClick={(e) => {
          e.preventDefault();
          props.setPageIndex(index);
          return false;
        }}>{index + 1}</a>
      </li>
    );
  }
  return buttons;
}
