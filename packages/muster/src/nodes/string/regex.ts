import {
  isNodeDefinition,
  NodeDefinition,
  NodeLike,
  StaticGraphNode,
  StaticNodeDefinition,
  StaticNodeType,
} from '../../types/graph';
import createNodeDefinition from '../../utils/create-node-definition';
import { createNodeType } from '../../utils/create-node-type';
import { getInvalidTypeError } from '../../utils/get-invalid-type-error';
import * as types from '../../utils/types';

/**
 * An instance of the [[regex]] node.
 * See the [[regex]] documentation to find out more.
 */
export interface RegexNode
  extends StaticGraphNode<'regex', RegexNodeProperties, SerializedRegexNodeProperties> {}

/**
 * A definition of the [[regex]] node.
 * See the [[regex]] documentation to find out more.
 */
export interface RegexNodeDefinition
  extends StaticNodeDefinition<'regex', RegexNodeProperties, SerializedRegexNodeProperties> {}

export interface RegexNodeProperties {
  pattern: RegExp;
}

export interface SerializedRegexNodeProperties {
  pattern: { source: string; flags: string };
}

/**
 * The implementation of the [[regex]] node.
 * See the [[regex]] documentation to learn more.
 */
export const RegexNodeType: StaticNodeType<
  'regex',
  RegexNodeProperties,
  SerializedRegexNodeProperties
> = createNodeType<'regex', RegexNodeProperties, SerializedRegexNodeProperties>('regex', {
  shape: {
    pattern: types.oneOfType([types.string, types.saveHash(types.any)]),
  },
  serialize(properties: RegexNodeProperties): SerializedRegexNodeProperties {
    return {
      pattern: { source: properties.pattern.source, flags: properties.pattern.flags },
    };
  },
  deserialize(properties: SerializedRegexNodeProperties): RegexNodeProperties {
    return {
      pattern: new RegExp(properties.pattern.source, properties.pattern.flags),
    };
  },
});

/**
 * Creates a new instance of a [[regex]] node, which is used for storing a regular expressions in a form understandable
 * by Muster.
 */
export function regex(pattern: string | RegExp): RegexNodeDefinition {
  if (typeof pattern !== 'string' && !(pattern instanceof RegExp)) {
    throw getInvalidTypeError('Invalid type of pattern used to create regex node', {
      expected: ['string', 'RegExp'],
      received: pattern,
    });
  }
  return createNodeDefinition<'regex', RegexNodeProperties, SerializedRegexNodeProperties>(
    RegexNodeType,
    {
      pattern: pattern instanceof RegExp ? pattern : new RegExp(pattern),
    },
  );
}

export function isRegexNodeDefinition(regex: NodeDefinition): regex is RegexNodeDefinition {
  return regex.type === RegexNodeType;
}

export function toRegex(pattern: NodeLike): NodeDefinition {
  return isNodeDefinition(pattern) ? pattern : regex(pattern);
}
