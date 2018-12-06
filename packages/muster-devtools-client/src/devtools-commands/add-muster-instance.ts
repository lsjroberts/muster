import { Message } from '@dws/muster-message-transport';

export interface AddMusterInstanceMessage extends Message<'add-muster-instance'> {
  instanceId: string;
}

export function addMusterInstance(instanceId: string): AddMusterInstanceMessage {
  return {
    name: 'add-muster-instance',
    instanceId,
  };
}
