import { Muster } from '@dws/muster';
import { Message } from '@dws/muster-message-transport';

export type SendMessage = (message: Message<any>) => void;

export interface CommandRunner {
  runCommand(message: Message<any>): void;
  sendMessage: SendMessage;
}

export interface CommandRunnerState {}

export interface DevToolsCommand<
  T extends string,
  M extends Message<T>,
  C,
  S extends CommandRunnerState
> {
  name: T;
  run(this: CommandExecutionContext<C, S>, message: M): void;
}

export interface CommandExecutionContext<T, S extends CommandRunnerState> {
  app: Muster;
  config: T;
  getState(): S;
  setState(setter: (state: S) => S): void;
  sendMessage: SendMessage;
}

export function createCommandExecutionContext<C, S extends CommandRunnerState>(
  app: Muster,
  config: C,
  initialState: S,
  sendMessage: SendMessage,
): CommandExecutionContext<C, S> {
  let state = initialState;
  return {
    app,
    config,
    getState() {
      return state;
    },
    setState(setter) {
      state = setter(state);
    },
    sendMessage,
  };
}

export function createCommandRunner<C, S extends CommandRunnerState>(
  commandFactories: Array<DevToolsCommand<any, Message<any>, C, S>>,
  app: Muster,
  sendMessage: SendMessage,
  config: C,
  initialState: S,
): CommandRunner {
  const executionContext = createCommandExecutionContext(app, config, initialState, sendMessage);
  const commandsMap = commandFactories.reduce(
    (map, command) => {
      if (map[command.name]) {
        throw new Error(`Command ${command.name} already exists!`);
      }
      map[command.name] = command;
      return map;
    },
    {} as { [key: string]: DevToolsCommand<any, SendMessage, C, S> },
  );
  return {
    runCommand(message: Message<any>) {
      const command = commandsMap[message.name];
      // Check if the command is supported by the runner
      if (!command) return;
      command.run.call(executionContext, message);
    },
    sendMessage,
  };
}
