import muster, { NodeDefinition, ref, set, types, variable } from '@dws/muster';
import * as React from 'react';
import { operation, runScenario } from '.';
import { global } from '..';
import { container } from '../container';
import { propTypes } from '../types';

(() => {
  const globalMuster = () => muster({ outer: variable('foo') });

  const ExampleContainer = container({
    graph: {
      inner: ref(global('outer')),
    },
    props: {
      inner: types.any,
      setInner: propTypes.setter('inner', types.string),
    },
  });

  interface ExampleComponentProps {
    inner: string;
    setInner: (value: any) => Promise<NodeDefinition>;
  }

  // tslint:disable-next-line:function-name
  function ExampleComponent(props: ExampleComponentProps) {
    return (
      <div>
        <InnerValueComponent value={props.inner} />
        <button id="submit" onClick={() => props.setInner('clicked')}>
          Update
        </button>
      </div>
    );
  }

  interface InnerValueComponentProps {
    value: string;
  }

  // tslint:disable-next-line:function-name
  function InnerValueComponent(props: InnerValueComponentProps) {
    return <div>{props.value}</div>;
  }

  runScenario({
    description: 'Nested component (shallow)',
    graph: globalMuster,
    container: ExampleContainer,
    component: ExampleComponent,
    shallow: true,
    expected: {
      snapshot: true,
      props: {
        inner: 'foo',
        setInner: expect.any(Function),
      },
    },
    assert(results) {
      expect(
        results.view
          .children()
          .first()
          .prop('value'),
      ).toBe('foo');
    },
    operations: [
      operation({
        description: 'AND a variable is updated in the global graph',
        input: set(ref('outer'), 'bar'),
        expected: {
          snapshot: true,
          props: {
            inner: 'bar',
            setInner: expect.any(Function),
          },
        },
        assert(results) {
          expect(
            results.view
              .children()
              .first()
              .prop('value'),
          ).toBe('bar');
        },
      }),
      operation({
        description: 'AND a variable is updated via the component DOM',
        input: (results) => results.view.find('#submit').simulate('click'),
        expected: {
          snapshot: true,
          graph: {
            outer: 'clicked',
          },
          props: {
            inner: 'clicked',
            setInner: expect.any(Function),
          },
        },
        assert(results) {
          expect(
            results.view
              .children()
              .first()
              .prop('value'),
          ).toBe('clicked');
        },
      }),
      operation({
        description: 'AND a variable is updated via the component props',
        input: (results) => results.props.setInner('baz'),
        expected: {
          snapshot: true,
          graph: {
            outer: 'baz',
          },
          props: {
            inner: 'baz',
            setInner: expect.any(Function),
          },
        },
        assert(results) {
          expect(
            results.view
              .children()
              .first()
              .prop('value'),
          ).toBe('baz');
        },
      }),
    ],
  });

  runScenario({
    description: 'Nested component (deep)',
    graph: globalMuster,
    container: ExampleContainer,
    component: ExampleComponent,
    expected: {
      snapshot: true,
      props: {
        inner: 'foo',
        setInner: expect.any(Function),
      },
    },
    assert(results) {
      expect(
        results.view
          .children()
          .first()
          .prop('value'),
      ).toBe('foo');
    },
    operations: [
      operation({
        description: 'AND a variable is updated in the global graph',
        input: set(ref('outer'), 'bar'),
        expected: {
          snapshot: true,
          props: {
            inner: 'bar',
            setInner: expect.any(Function),
          },
        },
        assert(results) {
          expect(
            results.view
              .children()
              .first()
              .prop('value'),
          ).toBe('bar');
        },
      }),
      operation({
        description: 'AND a variable is updated via the component DOM',
        input: (results) => results.view.find('#submit').simulate('click'),
        expected: {
          snapshot: true,
          graph: {
            outer: 'clicked',
          },
          props: {
            inner: 'clicked',
            setInner: expect.any(Function),
          },
        },
        assert(results) {
          expect(
            results.view
              .children()
              .first()
              .prop('value'),
          ).toBe('clicked');
        },
      }),
      operation({
        description: 'AND a variable is updated via the component props',
        input: (results) => results.props.setInner('baz'),
        expected: {
          snapshot: true,
          graph: {
            outer: 'baz',
          },
          props: {
            inner: 'baz',
            setInner: expect.any(Function),
          },
        },
        assert(results) {
          expect(
            results.view
              .children()
              .first()
              .prop('value'),
          ).toBe('baz');
        },
      }),
    ],
  });
})();
