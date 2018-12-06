import { SerializedGraphOperation, SerializedStore } from '@dws/muster';
import { StoreMetadata } from '@dws/muster-devtools-client';
import * as React from 'react';
import parseGraphTree, { GraphTreeHelpers } from '../../../utils/parse-graph-tree';
import createGraphHelpers from '../../utils/create-graph-helpers';
import memoizeLast from '../../utils/memoize-last';
import { GraphView } from '../graph-view';
import NODE_RENDERERS from '../graph-view/tree/node-renderers';
import OPERATION_RENDERERS from '../graph-view/tree/operation-renderers';

import './graph-explorer.css';

export type PartialStoreMetadata =
  | StoreMetadata
  | { [K in keyof StoreMetadata]: StoreMetadata[K] | null };

export interface GraphExplorerProps {
  store: PartialStoreMetadata | undefined;
  subscribedNodes: Array<any>;
  subscribeNode: (path: Array<SerializedGraphOperation>) => void;
  unsubscribeNode: (path: Array<SerializedGraphOperation>) => void;
}

export interface GraphExplorerState {
  uid: number;
}

// tslint:disable-next-line:function-name
export class GraphExplorerView extends React.PureComponent<GraphExplorerProps, GraphExplorerState> {
  private getHelpers = memoizeLast(
    (store: SerializedStore | undefined): GraphTreeHelpers => {
      return createGraphHelpers(store, {
        nodes: NODE_RENDERERS,
        operations: OPERATION_RENDERERS,
        subscribe: (path: Array<SerializedGraphOperation>) => {
          let disposed = false;
          this.props.subscribeNode(path);
          return () => {
            if (disposed) return;
            disposed = true;
            this.props.unsubscribeNode(path);
          };
        },
      });
    },
  );
  private parseTree = memoizeLast((store: StoreMetadata) => parseGraphTree(store));

  constructor(props: GraphExplorerProps, context: {}) {
    super(props, context);
    this.state = {
      uid: 0,
    };
  }

  public render(): JSX.Element {
    const { store } = this.props;
    const validStore = store && isValidNodeMetadata(store) ? store : undefined;
    const roots = validStore && this.parseTree(validStore);
    const helpers = this.getHelpers(validStore);
    return <GraphView className="GraphExplorer__root" roots={roots} helpers={helpers} />;
  }
}

function isValidNodeMetadata(value: PartialStoreMetadata | undefined): value is StoreMetadata {
  return Boolean(
    value &&
      value.scope !== null &&
      value.context !== null &&
      value.cache !== null &&
      value.subscriptions !== null,
  );
}
