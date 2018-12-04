import {
  isErrorNodeDefinition,
  isNodeDefinition,
  QuoteNodeDefinition,
  valueOf,
} from '@dws/muster-react';
import intersection from 'lodash/intersection';
import partial from 'lodash/partial';
import toPairs from 'lodash/toPairs';
import * as React from 'react';
import { ReflexContainer, ReflexElement, ReflexSplitter } from 'react-reflex';

import CodeEditor from '../code-editor';
import ErrorPreview from '../error-preview';
import Panel from './panel';

import 'react-reflex/styles.css';
import './query-editor.css';

export interface QueryEditorProps {
  className: string;
  graphDefinition: string;
  queryDefinition: string;
  containerGraphDefinition: string;
  viewDefinition: string;
  viewResult: any;
  result: QuoteNodeDefinition;
  setGraph: () => void;
  setQuery: () => void;
  setContainerGraph: () => void;
  setView: () => void;
  toggles: QueryEditorToggles;
  setToggles: (toggles: QueryEditorToggles) => void;
  initialise: () => void;
}

export interface QueryEditorToggles {
  [key: string]: boolean;
}

export default class QueryEditor extends React.PureComponent<QueryEditorProps> {
  public static defaultProps: Partial<QueryEditorProps> = {
    className: undefined,
  };

  togglePanel = (showPanel: string) => {
    const { toggles, setToggles } = this.props;

    setToggles({ ...toggles, [showPanel]: !toggles[showPanel] });
  };

  getButtonColor(showPanel: string) {
    return this.props.toggles[showPanel] ? 'primary' : 'light';
  }

  renderButton(panel: string, title: string) {
    return (
      <button
        className={`btn btn-sm btn-${this.getButtonColor(panel)}`}
        onClick={partial(this.togglePanel, panel)}
      >
        {title}
      </button>
    );
  }

  componentDidMount() {
    if (this.props.initialise) {
      this.props.initialise();
    }
  }

  renderToggles() {
    return (
      <div className="btn-group" role="group" aria-label="Panel Toggles">
        {this.renderButton('showGraph', 'Graph')}
        {this.renderButton('showQuery', 'Query')}
        {this.renderButton('showQueryResult', 'Query Result')}
        {this.renderButton('showView', 'View')}
        {this.renderButton('showContainer', 'Container')}
        {this.renderButton('showViewResult', 'View Result')}
      </div>
    );
  }

  onResizePane = (id: string, event: any, size = event.component.props.flex) => {
    localStorage.setItem(`@muster-playground-${id}`, JSON.stringify(size));
  };

  getFlexSize(key: string): number {
    const savedValue = localStorage.getItem(`@muster-playground-${key}`);
    if (!savedValue) return 1;
    return JSON.parse(savedValue) || 1;
  }

  renderGraphEditor() {
    const { graphDefinition, setGraph, toggles } = this.props;

    return toggles.showGraph ? (
      <ReflexElement
        onResize={partial(this.onResizePane, 'graph')}
        flex={this.getFlexSize('graph')}
        propagateDimensions={true}
        renderOnResize={true}
      >
        <Panel id="graph" header="Graph">
          <CodeEditor value={graphDefinition} onChange={setGraph} />
        </Panel>
      </ReflexElement>
    ) : null;
  }

  renderQueryEditor() {
    const { queryDefinition, setQuery, toggles } = this.props;

    return toggles.showQuery ? (
      <ReflexElement
        onResize={partial(this.onResizePane, 'query')}
        flex={this.getFlexSize('query')}
        propagateDimensions={true}
        renderOnResize={true}
      >
        <Panel id="query" header="Query">
          <CodeEditor value={queryDefinition} onChange={setQuery} />
        </Panel>
      </ReflexElement>
    ) : null;
  }

  renderQueryResult() {
    const { toggles } = this.props;
    const result = this.props.result.properties.node;
    return toggles.showQueryResult ? (
      <ReflexElement
        onResize={partial(this.onResizePane, 'queryResult')}
        flex={this.getFlexSize('queryResult')}
        propagateDimensions={true}
        renderOnResize={true}
      >
        <Panel id="queryResult" header="Query Result" scrollable>
          {result && isNodeDefinition(result) && isErrorNodeDefinition(result) ? (
            <ErrorPreview
              message={result.properties.error ? result.properties.error.message : ''}
              path={result.properties.path}
            />
          ) : (
            <CodeEditor value={safeToString(result)} readonly />
          )}
        </Panel>
      </ReflexElement>
    ) : null;
  }

  renderViewResult() {
    const {
      viewResult: { container },
      toggles,
    } = this.props;
    return toggles.showViewResult ? (
      <ReflexElement
        onResize={partial(this.onResizePane, 'musterReactResult')}
        flex={this.getFlexSize('musterReactResult')}
        propagateDimensions={true}
        renderOnResize={true}
      >
        <Panel id="musterReactResult" header="Muster-React Result" scrollable>
          {container}
        </Panel>
      </ReflexElement>
    ) : null;
  }

  renderContainerEditor() {
    const { containerGraphDefinition, setContainerGraph, toggles } = this.props;

    return toggles.showContainer ? (
      <ReflexElement
        onResize={partial(this.onResizePane, 'containerGraph')}
        flex={this.getFlexSize('containerGraph')}
        propagateDimensions={true}
        renderOnResize={true}
      >
        <Panel id="containerGraph" header="Container Graph">
          <CodeEditor value={containerGraphDefinition} onChange={setContainerGraph} />
        </Panel>
      </ReflexElement>
    ) : null;
  }

  renderViewEditor() {
    const { viewDefinition, setView, toggles } = this.props;
    return toggles.showView ? (
      <ReflexElement
        onResize={partial(this.onResizePane, 'viewEditor')}
        flex={this.getFlexSize('viewEditor')}
        propagateDimensions={true}
        renderOnResize={true}
      >
        <Panel id="viewEditor" header="View">
          <CodeEditor value={viewDefinition} onChange={setView} language="javascript" />
        </Panel>
      </ReflexElement>
    ) : null;
  }

  getVisiblePanels() {
    return toPairs(this.props.toggles)
      .filter(([_, value]) => value)
      .map(([key, _]) => key);
  }

  shouldRenderTopView() {
    return (
      intersection(this.getVisiblePanels(), ['showGraph', 'showQuery', 'showQueryResult']).length >
      0
    );
  }

  shouldRenderBottomView() {
    return (
      intersection(this.getVisiblePanels(), ['showContainer', 'showView', 'showViewResult'])
        .length > 0
    );
  }

  renderTopView() {
    return this.shouldRenderTopView() ? (
      <ReflexElement
        onResize={partial(this.onResizePane, 'topView')}
        flex={this.getFlexSize('topView')}
      >
        <ReflexContainer orientation="vertical">
          {this.renderGraphEditor()}
          <ReflexSplitter />
          {this.renderQueryEditor()}
          <ReflexSplitter />
          {this.renderQueryResult()}
        </ReflexContainer>
      </ReflexElement>
    ) : null;
  }

  renderBottomView() {
    return this.shouldRenderBottomView() ? (
      <ReflexElement
        onResize={partial(this.onResizePane, 'bottomView')}
        flex={this.getFlexSize('bottomView')}
      >
        <ReflexContainer orientation="vertical">
          {this.renderViewEditor()}
          <ReflexSplitter />
          {this.renderContainerEditor()}
          <ReflexSplitter />
          {this.renderViewResult()}
        </ReflexContainer>
      </ReflexElement>
    ) : null;
  }

  updateVerticalSizes() {
    if (!this.shouldRenderBottomView()) {
      this.onResizePane('topView', {}, 1);
    }
    if (!this.shouldRenderTopView()) {
      this.onResizePane('bottomView', {}, 1);
    }
  }

  render() {
    this.updateVerticalSizes();

    return (
      <div className="QueryEditorContainer">
        <div className="ToggleButtons">{this.renderToggles()}</div>
        <ReflexContainer orientation="horizontal">
          {this.renderTopView()}
          {this.shouldRenderTopView() && this.shouldRenderBottomView() ? <ReflexSplitter /> : null}
          {this.renderBottomView()}
        </ReflexContainer>
      </div>
    );
  }
}

function safeToString(value: any) {
  try {
    return JSON.stringify(value && isNodeDefinition(value) ? valueOf(value) : value, null, 2);
  } catch (ex) {
    return ex.toString();
  }
}
