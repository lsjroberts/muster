import classNames from 'classnames';
import React from 'react';
import {
  ArticlesListSource_Articles,
  ArticlesListSource_Feed,
} from '../../components/articles-list/articles-list.container';
import { ArticlesList } from '../../components/articles-list';

export interface HomeViewProps {
  filterTag: string;
  source: string;
  tags: Array<string>;
}

export function HomeView(props: HomeViewProps) {
  return (
    <div className="home-page">

      <div className="banner">
        <div className="container">
          <h1 className="logo-font">conduit</h1>
          <p>A place to share your knowledge.</p>
        </div>
      </div>

      <div className="container page">
        <div className="row">

          <div className="col-md-9">
            <div className="feed-toggle">
              <ul className="nav nav-pills outline-active">
                <li className="nav-item">
                  <a
                    className={classNames('nav-link', {
                      active: props.source === ArticlesListSource_Feed,
                    })}
                    href="#/feed"
                  >
                    Your Feed
                  </a>
                </li>
                <li className="nav-item">
                  <a
                    className={classNames('nav-link', {
                      active: props.source === ArticlesListSource_Articles,
                    })}
                    href="#/"
                  >
                    Global Feed
                  </a>
                </li>
              </ul>
            </div>

            <ArticlesList source={props.source} tag={props.filterTag} />

          </div>

          <div className="col-md-3">
            <div className="sidebar">
              <p>Popular Tags</p>

              <div className="tag-list">
                {props.tags.map((tag) => (
                  <a key={tag} href={`#/?tag=${encodeURIComponent(tag)}`} className="tag-pill tag-default">{tag}</a>
                ))}
              </div>
            </div>
          </div>

        </div>
      </div>

    </div>
  );
}


