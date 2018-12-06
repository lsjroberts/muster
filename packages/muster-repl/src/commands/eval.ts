import * as muster from '@dws/muster';
const repl = require('repl');
const vm = require('vm');
import { Command, CommandOutput, ReplState } from '../types';
import { formatCode, formatString } from '../utils/formats';
import isRecoverableError from '../utils/is-recoverable-error';

const evalCommand: Command = {
  isMatch(): boolean {
    return true;
  },
  async evaluate(input: string, context: any, state: ReplState): Promise<CommandOutput> {
    let output: any;
    try {
      output = vm.runInContext(input, context);
    } catch (e) {
      if (isRecoverableError(e)) {
        return { error: new repl.Recoverable(e) };
      }
      return { error: e };
    }
    if (output instanceof muster.Muster) {
      context.app = output;
      return {
        result: formatString('Created a new muster instance.'),
        state: {
          ...state,
          subscriptions: [],
        },
      };
    }
    if (muster.isNodeDefinition(output)) {
      const resolvedNode = await context.app.resolve(output, { raw: true });
      return { result: formatCode(muster.getType(resolvedNode)) };
    }
    return { result: formatCode(muster.getType(output)) };
  },
};

export default evalCommand;
