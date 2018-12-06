import { Message } from '@dws/muster-message-transport';

export interface RemoveMusterInstanceMessage extends Message<'remove-muster-instance'> {
  instanceId: string;
}

export function removeMusterInstance(instanceId: string): RemoveMusterInstanceMessage {
  return {
    name: 'remove-muster-instance',
    instanceId,
  };
}
