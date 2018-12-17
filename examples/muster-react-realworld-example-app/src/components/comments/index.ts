import { CommentsView } from './comments';
import {
  CommentsContainer,
  CommentsExternalProps,
} from './comments.container';

export const Comments = CommentsContainer<CommentsExternalProps>(CommentsView);
