import uniq from 'lodash/uniq';
import monacoEditor from 'monaco-editor';
// tslint:disable-next-line:import-name-case-insensitive
const types = require('../../../type-definition/types.json');

const musterExports = uniq(Object.keys(types));

const generateParamSignatures = (params: Array<any>) =>
  params.map((param) => ({ label: param, documentation: param }));

const iterateInput = (input: string | undefined) => {
  if (!input) return {};
  const stack = [];
  let key = [];
  let i = 0;
  let inArray = false;

  while (input[i]) {
    const char = input[i];

    if (char === '(') {
      stack.unshift({
        keyword: key.join('').trim(),
        activeParameter: 0,
      });
      key = [];
    } else if (char === ')') {
      stack.shift();
    } else if (char === '[') {
      inArray = true;
    } else if (char === ']') {
      inArray = false;
    } else if (char === ',' && !inArray) {
      const currentKeyword = stack[0];
      if (currentKeyword) {
        // tslint:disable-next-line:no-increment-decrement
        currentKeyword.activeParameter++;
      }
      key = [];
    } else {
      key.push(char);
    }
    i += 1;
  }

  return stack[0] || {};
};

const getCurrentKeyword = (match: string) => {
  const input = match.split(':');
  return iterateInput(input && input[1]);
};

const provideSignatureHelp = (
  model: monacoEditor.editor.ITextModel,
  position: monacoEditor.Position,
): monacoEditor.languages.SignatureHelp => {
  const lineContent = model.getLineContent(position.lineNumber);
  const textUntilPosition = lineContent.substring(0, position.column).trim();
  const { keyword, activeParameter } = getCurrentKeyword(textUntilPosition);
  if (!keyword) {
    return {
      signatures: [],
      activeSignature: -1,
      activeParameter: -1,
    };
  }
  const args = (types as any)[keyword] || [];
  return {
    signatures: [
      {
        label: `${keyword}( ${args.join(', ')} )`,
        documentation: undefined,
        parameters: generateParamSignatures(args),
      },
    ],
    activeSignature: 0,
    activeParameter: activeParameter || 0,
  };
};

export const registerLanguage = (monaco: typeof monacoEditor, getRefs: () => Array<string>) => {
  monaco.languages.register({ id: 'muster' });
  const text = musterExports.map((name) => {
    const definition = (types as any)[name];
    return {
      label: name,
      kind: monaco.languages.CompletionItemKind[definition.type] as any,
      insertText: `${name}`,
    };
  });

  monaco.languages.setLanguageConfiguration('muster', {
    wordPattern: /(-?\d*\.\d\w*)|([^\`\~\!\@\#\%\^\&\*\(\)\-\=\+\[\{\]\}\\\|\;\:\'\"\,\.\<\>\/\?\s]+)/g,
    comments: {
      lineComment: '//',
      blockComment: ['/*', '*/'],
    },
    brackets: [['{', '}'], ['[', ']'], ['(', ')']],
    onEnterRules: [
      {
        beforeText: /^\s*\/\*\*(?!\/)([^\*]|\*(?!\/))*$/,
        afterText: /^\s*\*\/$/,
        action: { indentAction: monaco.languages.IndentAction.IndentOutdent, appendText: ' * ' },
      },
      {
        beforeText: /^\s*\/\*\*(?!\/)([^\*]|\*(?!\/))*$/,
        action: { indentAction: monaco.languages.IndentAction.None, appendText: ' * ' },
      },
      {
        beforeText: /^(\t|(\ \ ))*\ \*(\ ([^\*]|\*(?!\/))*)?$/,
        action: { indentAction: monaco.languages.IndentAction.None, appendText: '* ' },
      },
      {
        beforeText: /^(\t|(\ \ ))*\ \*\/\s*$/,
        action: { indentAction: monaco.languages.IndentAction.None, removeText: 1 },
      },
    ],
    autoClosingPairs: [
      { open: '{', close: '}' },
      { open: '[', close: ']' },
      { open: '(', close: ')' },
      { open: '"', close: '"', notIn: ['string'] },
      { open: "'", close: "'", notIn: ['string', 'comment'] },
      { open: '`', close: '`', notIn: ['string', 'comment'] },
    ],
    surroundingPairs: [
      { open: '{', close: '}' },
      { open: '[', close: ']' },
      { open: '(', close: ')' },
      { open: '`', close: '`' },
      { open: '"', close: '"' },
      { open: "'", close: "'" },
    ],
  });
  monaco.languages.setMonarchTokensProvider('muster', {
    keywords: musterExports,
    symbols: /[=><!~?:&|+\-*\/\^%]+/,
    escapes: /\\(?:[abfnrtv\\"']|x[0-9A-Fa-f]{1,4}|u[0-9A-Fa-f]{4}|U[0-9A-Fa-f]{8})/,
    tokenizer: {
      root: [
        [/[a-zA-Z_]\w*:/, 'key'],
        [
          /[a-zA-Z_]\w*/,
          {
            cases: {
              '@keywords': { token: 'variable.predefined' },
              '@default': 'identifier',
            },
          },
        ],
        [/"([^"\\]|\\.)*$/, 'string.invalid'], // non-teminated string
        [/'/, 'string', '@string'],
        [/`/, 'string', '@rawstring'],
        [/[{}()\[\]]/, '@brackets'],
      ],
      string: [
        [/[^\\']+/, 'string'],
        [/@escapes/, 'string.escape'],
        [/\\./, 'string.escape.invalid'],
        [/'/, 'string', '@pop'],
      ],
      rawstring: [[/[^\`]/, 'string'], [/`/, 'string', '@pop']],
    },
    tokenPostfix: '',
  } as any);

  monaco.languages.registerSignatureHelpProvider('muster', {
    signatureHelpTriggerCharacters: ['(', ','],
    provideSignatureHelp,
  });

  monaco.languages.registerCompletionItemProvider('muster', {
    provideCompletionItems: (model, position) => {
      const textUntilPosition = model.getValueInRange({
        startLineNumber: position.lineNumber,
        startColumn: 1,
        endLineNumber: position.lineNumber,
        endColumn: position.column,
      });
      const match = textUntilPosition.match(/.*ref\('$/);

      if (!match) return text as any;
      return getRefs().map((ref) => ({
        label: ref,
        kind: monaco.languages.CompletionItemKind.Value,
      }));
    },
  });
};

export const isLanguageRegistered = (monaco: typeof monacoEditor) =>
  monaco.languages.getLanguages().reduce((s, v) => s || v.id === 'muster', false);
