import { NetworkRequestsContainer } from './container';
import { NetworkRequestExternalProps, NetworkRequestsView } from './view';

export const NetworkRequests = NetworkRequestsContainer<NetworkRequestExternalProps>(
  NetworkRequestsView,
);
