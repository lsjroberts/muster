import { NodeLike } from '@dws/muster';
import { ContainerComponentFactory, Props } from './container-types';
import createContainerFactory from './utils/create-container-factory';

export function simpleContainer<PF, P extends Props<PF>>(
  props: P,
): ContainerComponentFactory<PF, P>;
export function simpleContainer<PF, P extends Props<PF>>(
  queryPrefix: Array<NodeLike>,
  props: P,
): ContainerComponentFactory<PF, P>;
export function simpleContainer<PF, P extends Props<PF>>(
  ...args: Array<Array<NodeLike> | P>
): ContainerComponentFactory<PF, P> {
  const queryPrefix = (args.length === 2 ? args[0] : undefined) as Array<NodeLike>;
  const props = (args.length === 1 ? args[0] : args[1]) as P;
  return createContainerFactory({
    queryPrefix,
    props,
  });
}
