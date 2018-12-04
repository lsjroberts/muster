import {
  createNodeDefinition,
  createNodeType,
  GraphNode,
  NodeDefinition,
  StatelessGraphNode,
  StatelessNodeDefinition,
  StatelessNodeType,
  value,
} from '@dws/muster';
import { NextFunction, Request, RequestHandler, Response } from 'express';

export const SESSION_PARAM_NAME = '$$session';

export interface SessionNode extends StatelessGraphNode<'session', SessionNodeProperties> {}

export interface SessionNodeDefinition
  extends StatelessNodeDefinition<'session', SessionNodeProperties> {}

export interface SessionNodeProperties {}

export const SessionNodeType: StatelessNodeType<'session', SessionNodeProperties> = createNodeType<
  'session',
  SessionNodeProperties
>('session', {
  shape: {},
  operations: {
    evaluate: {
      run(node: SessionNode): GraphNode {
        if (!(SESSION_PARAM_NAME in node.context.values)) {
          throw new Error('No session middleware detected');
        }
        return node.context.values[SESSION_PARAM_NAME];
      },
    },
  },
});

export function session(): SessionNodeDefinition {
  return createNodeDefinition(SessionNodeType, {});
}

export function isSessionNodeDefinition(value: NodeDefinition): value is SessionNodeDefinition {
  return value.type === SessionNodeType;
}

export function sessionMiddleware(): RequestHandler {
  return (req: Request, res: Response, next: NextFunction): void => {
    (req as any).context = {
      ...((req as any).context || {}),
      [SESSION_PARAM_NAME]: value((req as Request & { session: any }).session),
    };
    next();
  };
}
