import * as React from 'react';

export interface WatchedQuery {
  query: string;
  value: string;
}

export interface WatchesProperties {
  addWatch: (query: string) => void;
  newWatchQuery: string;
  setNewWatchQuery: (value: string) => void;
  watches: Array<WatchedQuery>;
}

// tslint:disable-next-line:function-name
export function Watches(props: WatchesProperties): JSX.Element {
  const { addWatch, newWatchQuery, setNewWatchQuery, watches } = props;
  return (
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
          {watches.map((watch) => (
            <tr key={watch.query}>
              <td>{watch.query}</td>
              <td>{watch.value}</td>
              <td>&nbsp;</td>
            </tr>
          ))}
          <tr>
            <td colSpan={3}>
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  addWatch(newWatchQuery);
                  return false;
                }}
              >
                <div className="form-group">
                  <input
                    className="form-control form-control-sm"
                    type="text"
                    value={newWatchQuery}
                    onChange={(e) => setNewWatchQuery(e.target.value)}
                  />
                </div>
              </form>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}
