import React from 'react';
import { ErrorList } from '../../components/error-list';

export interface EditorViewProps {
  article: {
    body: string;
    description: string;
    tags: string;
    title: string;
    setBody: (value: string) => void;
    setDescription: (value: string) => void;
    setTags: (value: string) => void;
    setTitle: (value: string) => void;
  };
  errors: Array<string>;
  isEditing: boolean;
  originalArticle: {
    tagList: Array<string>;
  };
  publish: () => void;
}

export function EditorView({
  article,
  errors,
  isEditing,
  originalArticle,
  publish,
}: EditorViewProps) {
  return (
    <div className="editor-page">
      <div className="container page">
        <div className="row">

          <ErrorList errors={errors} />

          <div className="col-md-10 offset-md-1 col-xs-12">
            <form onSubmit={(e) => {
              e.preventDefault();
              e.stopPropagation();
              publish();
              return false;
            }}>
              <fieldset>
                <fieldset className="form-group">
                  <input
                    type="text"
                    className="form-control form-control-lg"
                    placeholder="Article Title"
                    onChange={(e) => article.setTitle(e.currentTarget.value)}
                    value={article.title}
                  />
                </fieldset>
                <fieldset className="form-group">
                  <input
                    type="text"
                    className="form-control"
                    placeholder="What's this article about?"
                    onChange={(e) => article.setDescription(e.currentTarget.value)}
                    value={article.description}
                  />
                </fieldset>
                <fieldset className="form-group">
                  <textarea
                    className="form-control"
                    rows={8}
                    placeholder="Write your article (in markdown)"
                    onChange={(e) => article.setBody(e.currentTarget.value)}
                    value={article.body}
                  >
                  </textarea>
                </fieldset>
                <fieldset className="form-group">
                  {!isEditing && <input
                    type="text"
                    className="form-control"
                    placeholder="Enter tags"
                    onChange={(e) => article.setTags(e.currentTarget.value)}
                    value={article.tags}
                  />}
                  {isEditing && (
                    <ul className="tag-list">
                      {originalArticle.tagList.map((tag) => (
                        <li className="tag-default tag-pill tag-outline">{tag}</li>
                      ))}
                    </ul>
                  )}
                </fieldset>
                <button className="btn btn-lg pull-xs-right btn-primary" type="submit">
                  Publish Article
                </button>
              </fieldset>
            </form>
          </div>

        </div>
      </div>
    </div>
  );
}
