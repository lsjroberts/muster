import classNames from 'classnames';
import React from 'react';
import { ArticlesList } from '../../components/articles-list';
import { ArticlesListSource_Articles } from '../../components/articles-list/articles-list.container';

export interface ProfileViewProps {
  follow: () => void;
  unfollow: () => void;
  profile: {
    bio: string;
    following: boolean;
    image: string;
    username: string;
  };
  showFavorites: boolean;
}

export function ProfileView({ follow, unfollow, profile, showFavorites }: ProfileViewProps) {
  return (
    <div className="profile-page">

      <div className="user-info">
        <div className="container">
          <div className="row">

            <div className="col-xs-12 col-md-10 offset-md-1">
              {profile.image && <img src={profile.image} className="user-img"/>}
              <h4>{profile.username}</h4>
              <p>{profile.bio}</p>
              <button
                className="btn btn-sm btn-outline-secondary action-btn"
                onClick={profile.following ? unfollow : follow}
              >
                <i className={classNames({
                  'ion-minus-round': profile.following,
                  'ion-plus-round': !profile.following,
                })}>&nbsp;</i>
                &nbsp;
                {profile.following ? 'Unfollow' : 'Follow'} {profile.username}
              </button>
            </div>

          </div>
        </div>
      </div>

      <div className="container">
        <div className="row">

          <div className="col-xs-12 col-md-10 offset-md-1">
            <div className="articles-toggle">
              <ul className="nav nav-pills outline-active">
                <li className="nav-item">
                  <a
                    className={classNames('nav-link', {
                      active: !showFavorites,
                    })}
                    href={`#/profile/${profile.username}`}
                  >
                    My Articles
                  </a>
                </li>
                <li className="nav-item">
                  <a
                    className={classNames('nav-link', {
                      active: showFavorites,
                    })}
                    href={`#/profile/${profile.username}/favorites`}
                  >
                    Favorited Articles
                  </a>
                </li>
              </ul>
            </div>

            {!showFavorites && <ArticlesList author={profile.username} source={ArticlesListSource_Articles} />}
            {showFavorites && <ArticlesList favorited={profile.username} source={ArticlesListSource_Articles} />}
          </div>

        </div>
      </div>

    </div>
  );
}
