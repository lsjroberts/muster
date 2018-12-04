/*
  Code a mixture of
  https://github.com/superRaytin/react-monaco-editor/blob/master/src/editor.js
  and https://github.com/Microsoft/tsdoc/blob/master/playground/src/CodeEditor.tsx
 */
import monacoEditor from 'monaco-editor';
import React from 'react';

export type ChangeHandler = (
  value: string,
  event: monacoEditor.editor.IModelContentChangedEvent,
) => void;

export type EditorDidMount = (
  editor: monacoEditor.editor.IStandaloneCodeEditor,
  monaco: typeof monacoEditor,
) => void;

export type EditorWillMount = (monaco: typeof monacoEditor) => void;

declare interface MonacoEditorBaseProps {
  /**
   * Width of editor. Defaults to 100%.
   */
  width?: string | number;

  /**
   * Height of editor. Defaults to 500.
   */
  height?: string | number;

  /**
   * The initial value of the auto created model in the editor.
   */
  defaultValue?: string;

  /**
   * The initial language of the auto created model in the editor. Defaults to 'javascript'.
   */
  language?: string;

  /**
   * Theme to be used for rendering.
   * The current out-of-the-box available themes are: 'vs' (default), 'vs-dark', 'hc-black'.
   * You can create custom themes via `monaco.editor.defineTheme`.
   */
  theme?: string;

  /**
   * Optional, allow to config loader url and relative path of module, refer to require.config.
   */
  requireConfig?: any;

  /**
   * Optional, allow to pass a different context then the global window onto which the monaco instance will be loaded. Useful if you want to load the editor in an iframe.
   */
  context?: any;
}

export interface MonacoEditorProps extends MonacoEditorBaseProps {
  /**
   * Value of the auto created model in the editor.
   * If you specify value property, the component behaves in controlled mode. Otherwise, it behaves in uncontrolled mode.
   */
  value?: string | null;

  /**
   * Refer to Monaco interface {monaco.editor.IEditorConstructionOptions}.
   */
  options?: monacoEditor.editor.IEditorConstructionOptions;

  /**
   * An event emitted when the editor has been mounted (similar to componentDidMount of React).
   */
  editorDidMount?: EditorDidMount;

  /**
   * An event emitted before the editor mounted (similar to componentWillMount of React).
   */
  editorWillMount?: EditorWillMount;

  /**
   * An event emitted when the content of the current model has changed.
   */
  onChange?: ChangeHandler;
}

interface IMonacoWindow extends Window {
  monaco?: typeof monacoEditor;
  require: {
    (paths: Array<string>, callback: (monaco: typeof monacoEditor) => void): void;
    config: (options: { paths: { [name: string]: string } }) => void;
  };
  MonacoEnvironment: {
    getWorkerUrl: (workerId: string, label: string) => void;
  };
}

declare const MONACO_URL: string;
const MONACO_BASE_URL: string = MONACO_URL;

function noop() {}

class MonacoEditor extends React.Component<MonacoEditorProps> {
  private static initializePromise: Promise<typeof monacoEditor>;
  private static monaco: typeof monacoEditor;
  private containerElement: HTMLElement | undefined;
  private currentValue: string;
  private editor: monacoEditor.editor.IStandaloneCodeEditor;
  private preventTriggerChangeEvent: boolean;

  public static defaultProps: Partial<MonacoEditorProps> = {
    width: '100%',
    height: '100%',
    value: null,
    defaultValue: '',
    language: 'javascript',
    theme: '',
    options: {},
    editorDidMount: noop,
    editorWillMount: noop,
    onChange: noop,
  };

  constructor(props: MonacoEditorProps) {
    super(props);
    this.containerElement = undefined;
    this.currentValue = props.value || '';
  }

  componentDidMount() {
    this.createEditor();
  }

  componentDidUpdate(prevProps: MonacoEditorProps) {
    if (this.props.value !== this.currentValue) {
      // Always refer to the latest value
      this.currentValue = this.props.value || '';
      // Consider the situation of rendering 1+ times before the editor mounted
      if (this.editor) {
        this.preventTriggerChangeEvent = true;
        this.editor.setValue(this.currentValue);
        this.preventTriggerChangeEvent = false;
      }
    }

    if (prevProps.language !== this.props.language) {
      MonacoEditor.monaco.editor.setModelLanguage(
        this.editor.getModel(),
        this.props.language || '',
      );
    }
    if (prevProps.theme !== this.props.theme) {
      MonacoEditor.monaco.editor.setTheme(this.props.theme || '');
    }
    if (
      this.editor &&
      (this.props.width !== prevProps.width || this.props.height !== prevProps.height)
    ) {
      this.editor.layout();
    }
  }

  componentWillUnmount() {
    this.destroyMonaco();
  }

  editorWillMount(monaco: typeof monacoEditor) {
    const { editorWillMount } = this.props;
    if (editorWillMount) {
      editorWillMount(monaco);
    }
  }

  editorDidMount(editor: monacoEditor.editor.IStandaloneCodeEditor, monaco: typeof monacoEditor) {
    const { editorDidMount, onChange } = this.props;
    if (editorDidMount) {
      editorDidMount(editor, monaco);
    }
    editor.onDidChangeModelContent((event: monacoEditor.editor.IModelContentChangedEvent) => {
      const value = editor.getValue();

      // Always refer to the latest value
      this.currentValue = value;

      // Only invoking when user input changed
      if (!this.preventTriggerChangeEvent && onChange) {
        onChange(value, event);
      }
    });
  }

  private static initializeMonaco(): Promise<typeof monacoEditor> {
    if (!MonacoEditor.initializePromise) {
      MonacoEditor.initializePromise = new Promise(
        (resolve: (monaco: typeof monacoEditor) => void, reject: (error: Error) => void) => {
          const monacoWindow: IMonacoWindow = window as IMonacoWindow;
          monacoWindow.require.config({ paths: { vs: `${MONACO_BASE_URL}vs/` } });

          monacoWindow.MonacoEnvironment = {
            getWorkerUrl: () => {
              return `data:text/javascript;charset=utf-8,${encodeURIComponent(
                'self.MonacoEnvironment = {' +
                  `baseUrl: '${MONACO_BASE_URL}'` +
                  '};' +
                  `importScripts('${MONACO_BASE_URL}vs/base/worker/workerMain.js');`,
              )}`;
            },
          };

          monacoWindow.require(['vs/editor/editor.main'], (monaco) => {
            if (monaco) {
              resolve(monaco);
            } else {
              reject(new Error('Unable to load Monaco editor'));
            }
          });
        },
      ).then((monaco) => (MonacoEditor.monaco = monaco));
    }

    return MonacoEditor.initializePromise;
  }

  createEditor() {
    const value = this.props.value !== null ? this.props.value : this.props.defaultValue;
    const { language, theme, options } = this.props;
    MonacoEditor.initializeMonaco().then((monaco) => {
      if (!this.editor && this.containerElement) {
        this.editorWillMount(monaco);
        this.editor = monaco.editor.create(this.containerElement, {
          value,
          language,
          ...options,
          theme,
        });
        this.editorDidMount(this.editor, monaco);
      }
    });
  }

  destroyMonaco() {
    if (typeof this.editor !== 'undefined') {
      this.editor.dispose();
    }
  }

  assignRef = (component: HTMLDivElement) => {
    this.containerElement = component;
  };

  render() {
    const { width = 0, height = 0 } = this.props;
    const fixedWidth = width.toString().indexOf('%') !== -1 ? width : `${width}px`;
    const fixedHeight = height.toString().indexOf('%') !== -1 ? height : `${height}px`;
    const style = {
      width: fixedWidth,
      height: fixedHeight,
    };

    return <div ref={this.assignRef} style={style} className="react-monaco-editor-container" />;
  }
}

export default MonacoEditor;
