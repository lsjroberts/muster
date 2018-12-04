import { call } from '@dws/muster';
import {
  AddMusterInstanceMessage,
  CommandExecutionContext,
  DevToolsCommand,
} from '@dws/muster-devtools-client';
import { DevToolsConfig, DevToolsState } from '..';

export const AddMusterInstanceCommand: DevToolsCommand<
  'add-muster-instance',
  AddMusterInstanceMessage,
  DevToolsConfig,
  DevToolsState
> = {
  name: 'add-muster-instance',
  async run(
    this: CommandExecutionContext<DevToolsConfig, DevToolsState>,
    message: AddMusterInstanceMessage,
  ) {
    await this.app.resolve(call('addInstance', [message.instanceId]));
  },
};
