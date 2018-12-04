import { deprecated } from '@dws/muster';
import identity from 'lodash/identity';
import {
  ContainerComponentFactory,
  ContainerConfiguration,
  Props,
  ScopeTransformer,
} from './container-types';
import createContainerFactory from './utils/create-container-factory';

const showDataDeprecationWarning = deprecated({ old: 'data', new: 'graph' });
const showCreateContainerDeprecationWarning = deprecated({
  old: 'createContainer',
  new: 'container',
});

function getComponentGraph<PF, P extends Props<PF>, RF, R extends Props<RF>>(
  configuration: ContainerConfiguration<PF, P, RF, R>,
): any {
  if (configuration.data) {
    showDataDeprecationWarning();
    return configuration.data;
  }
  return configuration.graph;
}

/**
 * Creates a new Muster React container.
 * @param configuration
 * @param transform
 * @deprecated
 */
export function createContainer<PF, P extends Props<PF>, RF, R extends Props<RF>>(
  configuration: ContainerConfiguration<PF, P, RF, R>,
  transform: ScopeTransformer = identity,
): ContainerComponentFactory<PF, P, RF, R> {
  showCreateContainerDeprecationWarning();
  return container(configuration, transform);
}

export function container<PF, P extends Props<PF>, RF, R extends Props<RF>>(
  configuration: ContainerConfiguration<PF, P, RF, R>,
  transform: ScopeTransformer = identity,
): ContainerComponentFactory<PF, P, RF, R> {
  return createContainerFactory(
    {
      events: configuration.events,
      graph: getComponentGraph(configuration),
      props: configuration.props,
      relaxPropsValidation: configuration.relaxPropsValidation,
      renderError: configuration.renderError,
      renderLoading: configuration.renderLoading,
      require: configuration.require,
    },
    transform,
  );
}
