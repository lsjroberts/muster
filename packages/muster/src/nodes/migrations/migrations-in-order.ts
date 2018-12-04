import from50to51 from './from-5-0-to-5-1'; // tslint:disable-line:import-name-case-insensitive
import from51to60 from './from-5-1-to-6-0'; // tslint:disable-line:import-name-case-insensitive
import { Migration } from './types';

export default [from50to51, from51to60] as Array<Migration>;
