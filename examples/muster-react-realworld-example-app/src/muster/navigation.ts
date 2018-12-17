import {
  location,
  otherwise,
  pattern,
  ref,
  scope,
  startsWith,
  switchOn,
  when,
} from '@dws/muster';

export enum Pages {
  Article = 'Article',
  EditPost = 'EditPost',
  Home = 'Home',
  Login = 'Login',
  NewPost = 'NewPost',
  Profile = 'Profile',
  Settings = 'Settings',
  SignUp = 'SignUp',
  NotFound = 'NotFound',
}

export const navigation = scope({
  currentPage: switchOn(ref('location', 'path'), [
    when('/', Pages.Home),
    when('/feed', Pages.Home),
    when(pattern((_) => startsWith('/article/', _)), Pages.Article),
    when('/editor', Pages.NewPost),
    when(pattern((_) => startsWith('/editor/', _)), Pages.EditPost),
    when('/login', Pages.Login),
    when(pattern((_) => startsWith('/profile/', _)), Pages.Profile),
    when('/settings', Pages.Settings),
    when('/register', Pages.SignUp),
    otherwise(Pages.NotFound),
  ]),
  location: location({
    hash: 'slash',
  }),
});
