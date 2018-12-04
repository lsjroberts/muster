import { Message } from '@dws/muster-message-transport';
import { DevToolsCommand } from '../command-runner';
import { addMusterInstance } from '../devtools-commands';
import { DevToolsClientConfig, DevToolsClientState } from '../with-dev-tools';

export interface FindInstancesMessage extends Message<'find-instances'> {}

export function findInstances(): FindInstancesMessage {
  return { name: 'find-instances' };
}

export const FindInstancesCommand: DevToolsCommand<
  'find-instances',
  FindInstancesMessage,
  DevToolsClientConfig,
  DevToolsClientState
> = {
  name: 'find-instances',
  run(): void {
    this.sendMessage(addMusterInstance(this.config.instanceId));
  },
};
