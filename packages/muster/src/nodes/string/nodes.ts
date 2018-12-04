import { NodeType } from '../../types/graph';
import { CharAtNodeType } from './char-at';
import { EndsWithNodeType } from './ends-with';
import { FormatNodeType } from './format';
import { FromBase64NodeType } from './from-base64';
import { IncludesNodeType } from './includes';
import { JoinNodeType } from './join';
import { LowerCaseNodeType } from './lower-case';
import { MatchPatternNodeType } from './match-pattern';
import { ParseFloatNodeType } from './parse-float';
import { ParseIntNodeType } from './parse-int';
import { RegexNodeType } from './regex';
import { ReplaceNodeType } from './replace';
import { SentenceCaseNodeType } from './sentence-case';
import { SplitNodeType } from './split';
import { StartCaseNodeType } from './start-case';
import { StartsWithNodeType } from './starts-with';
import { SubstringNodeType } from './substring';
import { TestNodeType } from './test';
import { ToBase64NodeType } from './to-base64';
import { ToStringNodeType } from './to-string';
import { TrimNodeType } from './trim';
import { TruncateNodeType } from './truncate';
import { UpperCaseNodeType } from './upper-case';

export const StringNodeTypes: Array<NodeType> = [
  CharAtNodeType,
  EndsWithNodeType,
  FormatNodeType,
  FromBase64NodeType,
  IncludesNodeType,
  JoinNodeType,
  LowerCaseNodeType,
  MatchPatternNodeType,
  ParseFloatNodeType,
  ParseIntNodeType,
  RegexNodeType,
  ReplaceNodeType,
  SentenceCaseNodeType,
  SplitNodeType,
  StartCaseNodeType,
  StartsWithNodeType,
  SubstringNodeType,
  TestNodeType,
  ToBase64NodeType,
  ToStringNodeType,
  TrimNodeType,
  TruncateNodeType,
  UpperCaseNodeType,
];
