import * as muster from '@dws/muster';
const repl = require('repl');
const vm = require('vm');
import { Command, CommandOutput, NamedSubscription, ReplState } from '../types';
import { formatCode, formatString } from '../utils/formats';
import isRecoverableError from '../utils/is-recoverable-error';

interface SubscribeMetadata {
  name: string;
  nodeString: string;
}

function getSubscribeRegex() {
  return /^(?:sub|subscribe)(?::([a-z]\w*))?\s+(.*)$/gi;
}

let nextSubscriptionId = 1;

function parseSubscribeInput(input: string): SubscribeMetadata {
  const matches = getSubscribeRegex().exec(input)!;
  return {
    name: matches[1] ? matches[1] : `${nextSubscriptionId++}`, // tslint:disable-line:no-increment-decrement
    nodeString: matches[2],
  };
}

const subscribeCommand: Command = {
  isMatch(input: string): boolean {
    return getSubscribeRegex().test(input);
  },
  async evaluate(input: string, context: any, state: ReplState): Promise<CommandOutput> {
    const { name, nodeString } = parseSubscribeInput(input);
    let output: any;
    try {
      output = vm.runInContext(nodeString, context);
    } catch (e) {
      if (isRecoverableError(e)) {
        return { error: new repl.Recoverable(e) };
      }
      return { error: e };
    }
    if (!output || !muster.isGraphNode(output)) {
      return { error: 'Subscription target must be a graph node.' };
    }
    const namedSubscription: NamedSubscription = {
      name,
      request: nodeString,
      subscription: null as any,
    };
    namedSubscription.subscription = context.app
      .resolve(output, { raw: true })
      .subscribe((value: muster.GraphNode) => {
        const stringValue = muster.getType(value);
        namedSubscription.lastValue = stringValue;
        console.log(formatString(`Subscription ${name}: `), formatCode(stringValue));
      });
    return {
      result: formatString(`Subscription "${name}" opened`),
      state: {
        ...state,
        subscriptions: [...state.subscriptions, namedSubscription],
      },
    };
  },
};

export default subscribeCommand;
