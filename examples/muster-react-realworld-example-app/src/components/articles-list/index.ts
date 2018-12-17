import { ArticlesListView } from './articles-list';
import {
  ArticlesListContainer,
  ArticlesListExternalProps,
} from './articles-list.container';

export const ArticlesList = ArticlesListContainer<ArticlesListExternalProps>(ArticlesListView);
