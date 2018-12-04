import * as React from 'react';

import { Matcher, types } from '@dws/muster';

import './graph-input.css';

interface GraphInputProps<T> {
  shape: Matcher<T>;
  onSubmit?: (value: T) => void;
}

interface GraphInputState<T> {
  currentValue: T | undefined;
}

export default class GraphInput<T> extends React.PureComponent<
  GraphInputProps<T>,
  GraphInputState<T>
> {
  constructor(props: GraphInputProps<T>, context: {}) {
    super(props, context);
    this.state = {
      currentValue: undefined,
    };
  }

  public render(): JSX.Element {
    const { shape } = this.props;
    const { currentValue } = this.state;
    return (
      <form
        className="GraphInput__root"
        onSubmit={this.handleFormSubmit}
        onReset={this.handleFormReset}
      >
        {createFormInput(shape, currentValue, this.handleInputChange)}
        <button type="submit">Watch</button>
      </form>
    );
  }

  private handleInputChange = (value: T): void => {
    this.setState(
      (prevState: GraphInputState<T>): GraphInputState<T> => ({
        ...prevState,
        currentValue: value,
      }),
    );
  };

  private handleFormSubmit = (e: React.FormEvent<HTMLFormElement>): void => {
    const { onSubmit } = this.props;
    e.preventDefault();
    if (!onSubmit) {
      return;
    }
    const { currentValue } = this.state;
    if (currentValue === undefined) {
      return;
    }
    this.setState(
      (prevState: GraphInputState<T>): GraphInputState<T> => ({
        ...prevState,
        currentValue: undefined,
      }),
    );
    onSubmit(currentValue);
  };

  private handleFormReset = (e: React.FormEvent<HTMLFormElement>): void => {
    e.preventDefault();
    this.setState(
      (prevState: GraphInputState<T>): GraphInputState<T> => ({
        ...prevState,
        currentValue: undefined,
      }),
    );
  };
}

function createFormInput<T>(
  shape: Matcher<T>,
  value: T,
  onChange: (value: T) => void,
): JSX.Element | undefined {
  if (shape === types.string) {
    return <Input type="text" value={value as any} onChange={onChange as any} />;
  }
  if (shape === types.number) {
    return <Input type="number" value={value as any} onChange={onChange as any} />;
  }
  if (shape === types.bool) {
    return <Checkbox value={value as any} onChange={onChange as any} />;
  }
  return undefined;
}

interface InputProps {
  type: HTMLInputElement['type'];
  value: string | number;
  onChange?: (value: string | number) => void;
}
// tslint:disable-next-line:function-name
function Input(props: InputProps) {
  const { type, value, onChange } = props;
  return (
    <input
      className="GraphInput__input"
      type={type}
      value={value || ''}
      onChange={onChange && handleInputChange.bind(null, onChange)}
    />
  );
}

function handleInputChange(
  onChange: (value: string | number) => void,
  e: React.ChangeEvent<HTMLInputElement>,
): void {
  onChange(e.currentTarget.value);
}

interface CheckboxProps {
  value: boolean;
  onChange?: (value: boolean) => void;
}
// tslint:disable-next-line:function-name
function Checkbox(props: CheckboxProps) {
  const { value, onChange } = props;
  return (
    <input
      className="GraphInput__checkbox"
      type="checkbox"
      checked={Boolean(value)}
      onChange={onChange && handleCheckboxChange.bind(null, onChange)}
    />
  );
}

function handleCheckboxChange(
  onChange: (value: boolean) => void,
  e: React.ChangeEvent<HTMLInputElement>,
): void {
  onChange(e.currentTarget.checked);
}
