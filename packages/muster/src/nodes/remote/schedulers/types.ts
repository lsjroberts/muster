import { NodeDefinition } from '../../../types/graph';

export type SchedulerFactory = (factory: () => NodeDefinition) => NodeDefinition;
