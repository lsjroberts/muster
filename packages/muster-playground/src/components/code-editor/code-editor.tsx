import classnames from 'classnames';
import monacoEditor from 'monaco-editor';
import * as React from 'react';
import { isLanguageRegistered, registerLanguage } from './autocomplete';
import ReactMonacoEditor from './react-monaco-editor';

const options = {
  selectOnLineNumbers: true,
  contextmenu: false,
  automaticLayout: true,
  minimap: {
    enabled: false,
  },
};

export interface CodeEditorProps {
  className?: string;
  onChange?: () => void;
  readonly?: boolean;
  value: string;
  language?: string;
}

export default class CodeEditor extends React.Component<CodeEditorProps, {}> {
  public static defaultProps: Partial<CodeEditorProps> = {
    className: undefined,
    readonly: false,
    onChange: () => {},
    language: 'muster',
  };

  getRefs = (): Array<string> => {
    const keys = this.props.value.match(/\s(\w*):/gi);
    const values = [];
    if (keys) {
      for (const key of keys) {
        const keyMatch = key.match(/\s(\w*):/i);
        if (keyMatch) {
          values.push(keyMatch[1]);
        }
      }
    }
    return values;
  };

  editorWillMount = (monaco: typeof monacoEditor) => {
    if (!isLanguageRegistered(monaco)) {
      registerLanguage(monaco, this.getRefs);
    }
  };

  render() {
    const { className, value, readonly, onChange, language } = this.props;
    return (
      <div
        className={classnames('CodeEditor', className)}
        style={{ height: '100%', width: '100%' }}
      >
        {readonly ? (
          <code className="CodeEditor__editor">
            <pre>{value}</pre>
          </code>
        ) : (
          <ReactMonacoEditor
            language={language}
            theme="vs"
            value={value}
            options={options}
            onChange={onChange}
            editorWillMount={this.editorWillMount as any}
          />
        )}
      </div>
    );
  }
}
