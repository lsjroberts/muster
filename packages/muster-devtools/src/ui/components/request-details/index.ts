import { RequestDetailsContainer } from './container';
import { RequestDetailsExternalProps, RequestDetailsView } from './view';

export const RequestDetails = RequestDetailsContainer<RequestDetailsExternalProps>(
  RequestDetailsView,
);
