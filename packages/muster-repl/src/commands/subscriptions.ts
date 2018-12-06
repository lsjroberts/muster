import { Command, CommandOutput, ReplState } from '../types';
import { formatCode, formatString } from '../utils/formats';

const subscriptionsCommand: Command = {
  isMatch(input: string): boolean {
    return /^(subs|subscriptions)$/gi.test(input);
  },
  evaluate(input: string, context: any, state: ReplState): CommandOutput {
    if (state.subscriptions.length === 0) {
      return {
        result: formatString('No open subscriptions.'),
      };
    }
    state.subscriptions.forEach((namedSubscription, index) => {
      console.log(
        formatString(`Name "${namedSubscription.name}": `),
        formatCode(namedSubscription.request),
      );
      console.log(
        formatString(`Last value: `),
        formatCode((namedSubscription.lastValue || '').toString()),
      );
      if (index < state.subscriptions.length - 1) {
        console.log('');
      }
    });
    return { result: '' };
  },
};

export default subscriptionsCommand;
