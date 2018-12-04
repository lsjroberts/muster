import { Command, CommandOutput, NamedSubscription, ReplState } from '../types';
import { formatString } from '../utils/formats';

function getUnsubscribeRegex() {
  return /^(?:unsub|unsubscribe)\s+(.*)$/gi;
}

function findNamedSubscription(
  subscriptions: Array<NamedSubscription>,
  name: string,
): NamedSubscription | undefined {
  return subscriptions.find((s) => s.name === name);
}

const unsubscribeCommand: Command = {
  isMatch(input: string): boolean {
    return getUnsubscribeRegex().test(input);
  },
  async evaluate(input: string, context: any, state: ReplState): Promise<CommandOutput> {
    const subscriptionName = getUnsubscribeRegex().exec(input)![1];
    const namedSubscription = findNamedSubscription(state.subscriptions, subscriptionName);
    if (!namedSubscription) {
      return {
        error: `Could not find a subscription: ${subscriptionName}`,
      };
    }
    namedSubscription.subscription.unsubscribe();
    return {
      result: formatString(`Subscription "${subscriptionName}" closed.`),
      state: {
        ...state,
        subscriptions: state.subscriptions.filter((s) => s.name !== subscriptionName),
      },
    };
  },
};

export default unsubscribeCommand;
