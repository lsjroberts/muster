import {
  createNodeDefinition,
  createNodeType,
  GraphNode,
  incorrectNodeType,
  NodeDefinition,
  StatelessGraphNode,
  StatelessNodeDefinition,
  StatelessNodeType,
  types,
  value,
  ValueNodeType,
} from '@dws/muster';
import { NextFunction, Request, RequestHandler, Response } from 'express';

export const HEADERS_PARAM_NAME = '$$headers';

export interface HeaderNode extends StatelessGraphNode<'http-header', HeaderNodeProperties> {}

export interface HeaderNodeDefinition
  extends StatelessNodeDefinition<'http-header', HeaderNodeProperties> {}

export interface HeaderNodeProperties {
  name: string;
}

export const HeaderNodeType: StatelessNodeType<
  'http-header',
  HeaderNodeProperties
> = createNodeType<'http-header', HeaderNodeProperties>('http-header', {
  shape: {
    name: types.string,
  },
  operations: {
    evaluate: {
      run(node: HeaderNode): NodeDefinition {
        if (!(HEADERS_PARAM_NAME in node.context.values)) {
          throw new Error('No headers middleware detected.');
        }
        const headers: GraphNode = node.context.values[HEADERS_PARAM_NAME];
        if (!ValueNodeType.is(headers)) {
          throw incorrectNodeType(ValueNodeType, headers);
        }
        const name = node.definition.properties.name;
        if (!(name in headers.definition.properties.value)) {
          console.warn(`Header '${name}' not found in the request headers`);
        }
        return value(headers.definition.properties.value[name]);
      },
    },
  },
});

export function header(name: string): HeaderNodeDefinition {
  return createNodeDefinition(HeaderNodeType, {
    name: name.toLowerCase(),
  });
}

export function isHeaderNodeDefinition(value: NodeDefinition): value is HeaderNodeDefinition {
  return value.type === HeaderNodeType;
}

export function headerMiddleware(): RequestHandler {
  return (req: Request, res: Response, next: NextFunction): void => {
    (req as any).context = {
      ...((req as any).context || {}),
      [HEADERS_PARAM_NAME]: value((req as Request & { headers: any }).headers),
    };
    next();
  };
}
