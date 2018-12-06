import * as React from 'react';
import { CodeEditor } from '../code-editor';

export interface WatchedQuery {
  id: number;
  isEditing: boolean;
  query: string;
  setIsEditing: (value: boolean) => void;
  setQuery: (value: string) => void;
  value: string;
}

export interface WatchesProperties {
  addWatch: (query: string) => void;
  deleteWatch: (id: number) => void;
  watches: Array<WatchedQuery>;
}

export const WatchesView = (props: WatchesProperties) => (
  <div>
    <h6>Watches</h6>
    <table className="table table-hover table-sm">
      <thead>
        <tr>
          <th scope="col">Query</th>
          <th scope="col">Value</th>
          <th scope="col">&nbsp;</th>
        </tr>
      </thead>
      <tbody>
        {props.watches.map(({ id, isEditing, query, setIsEditing, setQuery, value }) => {
          if (isEditing) {
            return (
              <tr key={id}>
                <td colSpan={3}>
                  <CodeEditor
                    initialValue={query}
                    onCancel={() => setIsEditing(false)}
                    onSubmit={(value) => {
                      const trimmedValue = (value || '').trim();
                      if (trimmedValue.length === 0) {
                        props.deleteWatch(id);
                        return;
                      }
                      setQuery(value);
                      setIsEditing(false);
                    }}
                  />
                </td>
              </tr>
            );
          }
          return (
            <tr key={id}>
              <td onDoubleClick={() => setIsEditing(true)}>{query}</td>
              <td>{value}</td>
              <td>
                <button
                  type="button"
                  className="close"
                  aria-label="Close"
                  onClick={() => props.deleteWatch(id)}
                >
                  <span aria-hidden="true">&times;</span>
                </button>
              </td>
            </tr>
          );
        })}
        <tr>
          <td colSpan={3}>
            <CodeEditor
              onSubmit={(value) => {
                const trimmedValue = (value || '').trim();
                if (trimmedValue.length === 0) return;
                props.addWatch(trimmedValue);
              }}
            />
          </td>
        </tr>
      </tbody>
    </table>
  </div>
);
