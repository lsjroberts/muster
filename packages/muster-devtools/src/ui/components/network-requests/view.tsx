import { MiddlewareRequestStatus } from '@dws/muster-devtools-client';
import { NodeDefinition } from '@dws/muster-react';
import classnames from 'classnames';
import * as React from 'react';
import { formatMiddlewareStatus, formatTime } from '../../utils';
import { RequestDetails } from '../request-details';

export interface NetworkRequest {
  createTime: number;
  id: number;
  middlewareName: string;
  query: {
    id: string;
    definition: NodeDefinition;
  };
  status: MiddlewareRequestStatus;
}

export interface NetworkRequestsProps {
  middlewareNames: Array<string>;
  requests: Array<NetworkRequest>;
  selectedRequestId: number | undefined;
  setSelectedRequestId: (value: number | undefined) => void;
}

export interface NetworkRequestExternalProps {
  proxyId: string;
}

export class NetworkRequestsView extends React.PureComponent<
  NetworkRequestsProps & NetworkRequestExternalProps
> {
  requestRowClick = (e: React.MouseEvent<HTMLTableRowElement>, requestId: number) => {
    this.props.setSelectedRequestId(
      (e.metaKey || e.ctrlKey) && this.props.selectedRequestId === requestId
        ? undefined
        : requestId,
    );
  };

  render() {
    const { middlewareNames, proxyId, requests, selectedRequestId } = this.props;
    const showRequestDetails = selectedRequestId !== undefined;
    return (
      <section className="row">
        <div className="col">
          <table className="table table-striped table-hover">
            <thead>
              <tr>
                <th className="border-top-0" scope="col">
                  #
                </th>
                <th className="border-top-0" scope="col">
                  Request time
                </th>
                <th className="border-top-0" scope="col">
                  Status
                </th>
              </tr>
            </thead>
            <tbody>
              {requests.map((request, index) => (
                <tr
                  className={classnames('clickable', {
                    'table-primary': request.id === selectedRequestId,
                  })}
                  key={request.id}
                  onClick={(e) => this.requestRowClick(e, request.id)}
                >
                  <td>{index + 1}</td>
                  <td>{formatTime(request.createTime)}</td>
                  <td>{formatMiddlewareStatus(request.status)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="col-9">
          {!showRequestDetails && (
            <h1 className="centered-heading">Select a request to see more details</h1>
          )}
          {showRequestDetails && (
            <RequestDetails
              middlewareNames={middlewareNames}
              proxyId={proxyId}
              requestId={selectedRequestId!}
            />
          )}
        </div>
      </section>
    );
  }
}
