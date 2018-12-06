import * as React from 'react';

export interface CodeEditorProperties {
  clearOnCancel?: boolean;
  initialValue?: string;
  onCancel?: () => void;
  onSubmit?: (value: string) => void;
  setValue: (value: string) => void;
  value: string;
}

export class CodeEditorView extends React.PureComponent<CodeEditorProperties> {
  constructor(props: CodeEditorProperties) {
    super(props);
    if (props.initialValue) {
      props.setValue(props.initialValue);
    }
  }

  onEditorBlur = () => {
    const clearOnCancel = this.props.clearOnCancel || false;
    if (clearOnCancel) {
      this.props.setValue('');
    }
    this.props.onCancel && this.props.onCancel();
  };

  onFormSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const { onSubmit, setValue } = this.props;
    onSubmit && onSubmit(this.props.value);
    setValue('');
    return false;
  };

  onValueChanged = (e: React.FormEvent<HTMLInputElement>) => {
    this.props.setValue(e.currentTarget.value);
  };

  render() {
    return (
      <form onSubmit={this.onFormSubmit}>
        <input
          autoFocus={true}
          className="form-control form-control-sm"
          onBlur={this.onEditorBlur}
          onChange={this.onValueChanged}
          type="text"
          value={this.props.value}
        />
      </form>
    );
  }
}
