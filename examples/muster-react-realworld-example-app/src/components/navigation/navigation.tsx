import classNames from 'classnames';
import React from 'react';
import { Pages } from '../../muster/navigation';

export interface NavigationViewProps {
  currentPage: Pages;
  isLoggedIn: boolean;
  username: string;
}

export function NavigationView({
  currentPage,
  isLoggedIn,
  username,
}: NavigationViewProps) {
  return (
    <nav className="navbar navbar-light">
      <div className="container">
        <a className="navbar-brand" href="#/">conduit</a>
        <ul className="nav navbar-nav pull-xs-right">
          <li className="nav-item">
            <a className={classNames('nav-link', {
              active: currentPage === Pages.Home,
            })} href="#/">Home</a>
          </li>
          {isLoggedIn && <li className="nav-item">
            <a className={classNames('nav-link', {
              active: currentPage === Pages.NewPost,
            })} href="#/editor">
              <i className="ion-compose"></i>&nbsp;New Post
            </a>
          </li>}
          {isLoggedIn && <li className="nav-item">
            <a className={classNames('nav-link', {
              active: currentPage === Pages.Settings,
            })} href="#/settings">
              <i className="ion-gear-a"></i>&nbsp;Settings
            </a>
          </li>}
          {!isLoggedIn && <li className="nav-item">
            <a className={classNames('nav-link', {
              active: currentPage === Pages.Login,
            })} href="#/login">Sign in</a>
          </li>}
          {!isLoggedIn && <li className="nav-item">
            <a className={classNames('nav-link', {
              active: currentPage === Pages.SignUp,
            })} href="#/register">Sign up</a>
          </li>}
          {isLoggedIn && <li className="nav-item">
            <a className="nav-link" href={`#/profile/${username}`}>{username}</a>
          </li>}
        </ul>
      </div>
    </nav>
  );
}
