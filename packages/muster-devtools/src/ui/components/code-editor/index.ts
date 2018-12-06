import { CodeEditorContainer } from './container';
import { CodeEditorView } from './view';

export interface ExternalCodeEditorProps {
  clearOnCancel?: boolean;
  initialValue?: string;
  onCancel?: () => void;
  onSubmit?: (value: string) => void;
}

export const CodeEditor = CodeEditorContainer<ExternalCodeEditorProps>(CodeEditorView);
