import { SerializedNodeDefinition } from '@dws/muster';
import { Message } from '..';

export const SubscriptionResultMessageName = 'muster-message-transport-subscription-result';

export interface SubscriptionResultMessage
  extends Message<'muster-message-transport-subscription-result'> {
  requestId: string;
  response: SerializedNodeDefinition;
}

export function subscriptionResult(
  requestId: string,
  response: SerializedNodeDefinition,
): SubscriptionResultMessage {
  return {
    name: SubscriptionResultMessageName,
    requestId,
    response,
  };
}
