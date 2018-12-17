/* eslint-disable import/no-extraneous-dependencies */

require('@babel/polyfill');
const { configure } = require('enzyme');
const Adapter = require('enzyme-adapter-react-16');

configure({ adapter: new Adapter() });
