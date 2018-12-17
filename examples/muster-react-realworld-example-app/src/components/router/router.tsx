import React from 'react';
import { Pages } from '../../muster/navigation';
import { Article } from '../../pages/article';
import { Editor } from '../../pages/editor';
import { Login } from '../../pages/login';
import { Home } from '../../pages/home';
import { Profile } from '../../pages/profile';
import { Settings } from '../../pages/settings';
import { SignUp } from '../../pages/sign-up';

export interface RouterViewProps {
  currentPage: Pages;
  isLoggedIn: boolean;
}

export function RouterView({ currentPage, isLoggedIn }: RouterViewProps) {
  switch (currentPage) {
    case Pages.Article:
      return <Article />;
    case Pages.Home:
      return <Home />;
    case Pages.Login:
      return isLoggedIn ? <Home /> : <Login />;
    case Pages.EditPost:
    case Pages.NewPost:
      return isLoggedIn ? <Editor /> : <Login />;
    case Pages.Profile:
      return isLoggedIn ? <Profile /> : <Login />;
    case Pages.Settings:
      return isLoggedIn ? <Settings /> : <Login />;
    case Pages.SignUp:
      return isLoggedIn ? <Home /> : <SignUp />;
    default:
      return <h1>Not found</h1>;
  }
}
