import React from 'react';
import { formatDate } from '../../utils/format-date';

export interface CommentsViewProps {
  addComment: () => void;
  commentBody: string;
  setCommentBody: (value: string) => void;
  comments: Array<{
    id: number,
    createdAt: string;
    updatedAt: string;
    body: string;
    author: {
      username: string;
      bio: string;
      image: string;
      following: boolean;
    };
  }> | undefined;
  deleteComment: (commentId: number) => void;
  isLoggedIn: boolean;
  user: {
    image: string;
    username: string;
  },
}

export function CommentsView(props: CommentsViewProps) {
  return (
    <div className="row">

      <div className="col-xs-12 col-md-8 offset-md-2">

        {props.isLoggedIn && (
          <form
            className="card comment-form"
            onSubmit={(e) => {
              e.preventDefault();
              e.stopPropagation();
              props.addComment();
              return false;
            }}
          >
            <div className="card-block">
              <textarea
                className="form-control"
                placeholder="Write a comment..."
                rows={3}
                value={props.commentBody}
                onChange={(e) => props.setCommentBody(e.currentTarget.value)}
              >
              </textarea>
            </div>
            <div className="card-footer">
              {props.user.image && <img src={props.user.image} className="comment-author-img"/>}
              <button className="btn btn-sm btn-primary">Post Comment</button>
            </div>
          </form>
        )}

        {props.comments && props.comments.map((comment) => (
          <div key={comment.id} className="card">
            <div className="card-block">
              <p className="card-text">{comment.body}</p>
            </div>
            <div className="card-footer">
              <a href={`#/profile/${comment.author.username}`} className="comment-author">
                {comment.author.image && (
                  <img src={comment.author.image} className="comment-author-img"/>
                )}
              </a>
              &nbsp;
              <a href={`#/profile/${comment.author.username}`} className="comment-author">
                {comment.author.username}
              </a>
              <span className="date-posted">{formatDate(comment.createdAt)}</span>
              {comment.author.username === props.user.username && <span className="mod-options">
                <i className="ion-trash-a" onClick={() => props.deleteComment(comment.id)}></i>
              </span>}
            </div>
          </div>
        ))}
      </div>

    </div>
  );
}
