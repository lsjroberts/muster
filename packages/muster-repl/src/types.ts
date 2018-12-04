import { Subscription } from '@dws/muster-observable';

export interface NamedSubscription {
  lastValue?: string;
  name: string;
  request: string;
  subscription: Subscription;
}

export interface ReplState {
  subscriptions: Array<NamedSubscription>;
}

export interface Command {
  isMatch: CommandMatcher;
  evaluate: CommandEvaluator;
}

export interface CommandOutput {
  error?: any;
  result?: any;
  state?: ReplState;
}

export type CommandMatcher = (input: string) => boolean;
export type CommandEvaluator = (
  input: string,
  context: any,
  state: ReplState,
) => CommandOutput | Promise<CommandOutput>;

export type CommandCallback = (error: any, output?: any) => any;
