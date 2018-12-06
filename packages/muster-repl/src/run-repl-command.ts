import eval from './commands/eval';
import load from './commands/load';
import subscribe from './commands/subscribe';
import subscriptions from './commands/subscriptions';
import unsubscribe from './commands/unsubscribe';
import { Command, CommandCallback, ReplState } from './types';
import { formatError } from './utils/formats';

// An array of commands, in order of precedence.
const commands = [subscriptions, subscribe, unsubscribe, load, eval];

function findMatchingCommand(input: string): Command | undefined {
  return commands.find((c) => c.isMatch(input));
}

let state: ReplState = {
  subscriptions: [],
};

export default async function runReplCommand(
  input: string,
  context: any,
  filename: string,
  callback: CommandCallback,
) {
  const trimmedInput = input.trim();
  const matchingCommand = findMatchingCommand(trimmedInput);
  if (!matchingCommand) {
    callback(`Invalid repl input: ${trimmedInput}`);
    return;
  }
  const output = await Promise.resolve(matchingCommand.evaluate(trimmedInput, context, state));
  if (output.state) {
    state = output.state;
  }
  if (output.error) {
    callback(formatError(output.error));
    return;
  }
  callback(null, output.result || '');
}
