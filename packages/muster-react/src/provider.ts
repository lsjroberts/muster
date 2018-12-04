import { Muster } from '@dws/muster';
import * as PropTypes from 'prop-types';
import { PureComponent, ReactElement } from 'react';
import getMuster from './utils/get-muster';

export interface ProviderProps {
  muster: Muster;
}

export default class Provider extends PureComponent<ProviderProps, {}> {
  static childContextTypes = {
    muster: PropTypes.object,
  };

  static propTypes = {
    muster: PropTypes.object,
    children: PropTypes.oneOfType([PropTypes.arrayOf(PropTypes.node), PropTypes.node]),
  };

  constructor(props: ProviderProps) {
    super(props);
  }

  getChildContext() {
    const muster = getMuster('Provider', this.props);
    if (!muster || !(muster instanceof Muster)) {
      throw new Error('MusterReact Provider was created without a valid Muster instance.');
    }
    return { muster };
  }

  render() {
    return this.props.children as ReactElement<{}>;
  }
}
