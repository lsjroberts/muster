import { History, Location } from 'history';
import fromPairs from 'lodash/fromPairs';
import mapValues from 'lodash/mapValues';
import toPairs from 'lodash/toPairs';

export const LOCATION_CHANGED = '$$event:location-changed';
export const LOCATION_PART_CHANGED = '$$event:location-part-changed';

export interface LocationValue {
  path: string;
  params: LocationParams;
}

export interface LocationParams {
  [key: string]: any;
}

export interface LocationParamsEncoder {
  encode(value: any): string;
  decode(value: string): any;
}

export interface HistoryUpdater {
  (state: any): void;
  (path: string, state?: any): void;
}

export function getHistoryUpdater(history: History, shouldUpdate?: Boolean): HistoryUpdater {
  return shouldUpdate ? history.replace : history.push;
}

export function locationToLocationValue(
  location: Location,
  encoder: LocationParamsEncoder,
): LocationValue {
  return {
    path: location.pathname,
    params: paramsFromSearch(location.search, encoder),
  };
}

export function paramsFromSearch(search: string, encoder: LocationParamsEncoder): LocationParams {
  if (search.length === 0) return {};
  const obj = fromPairs(
    search
      .substring(1)
      .split('&')
      .map((prop) => prop.split('=').map(decodeURIComponent)),
  );
  return mapValues(obj, encoder.decode);
}

export function paramsToSearch(params: LocationParams, encoder: LocationParamsEncoder): string {
  const search = toPairs(mapValues(params, encoder.encode))
    .map((keyValue) => keyValue.map(encodeURIComponent).join('='))
    .join('&');
  return search.length > 0 ? `?${search}` : '';
}
