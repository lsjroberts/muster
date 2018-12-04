import { call } from '@dws/muster';
import {
  CommandExecutionContext,
  DevToolsCommand,
  RemoveMusterInstanceMessage,
} from '@dws/muster-devtools-client';
import { DevToolsConfig, DevToolsState } from '..';

export const RemoveMusterInstanceCommand: DevToolsCommand<
  'remove-muster-instance',
  RemoveMusterInstanceMessage,
  DevToolsConfig,
  DevToolsState
> = {
  name: 'remove-muster-instance',
  async run(
    this: CommandExecutionContext<DevToolsConfig, DevToolsState>,
    message: RemoveMusterInstanceMessage,
  ) {
    await this.app.resolve(call('removeInstanceById', [message.instanceId]));
  },
};
