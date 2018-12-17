import {
  ErrorNodeDefinition,
  isNodeDefinition,
  MusterError,
  types,
} from '@dws/muster';
import flatMap from 'lodash/flatMap';

const IS_ERROR_MAP = types.objectOf(types.arrayOf(types.string));

export function getApiErrors(error: ErrorNodeDefinition | MusterError): Array<string> {
  const { data } = isNodeDefinition(error) ? error.properties : error;
  if (!data || !IS_ERROR_MAP(data)) return [
    isNodeDefinition(error) ? error.properties.error.message : error.message,
  ];
  return flatMap(Object.keys(data), (key) => data[key].map((error: string) => `${key} ${error}`));
}
