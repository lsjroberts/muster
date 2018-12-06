jest.setTimeout(50);
// React depends on requestAnimationFrame, polyfill here as it is not
// available in node
global.requestAnimationFrame = function(next) {
  return setTimeout(next, 0);
};
// And polyfill cancelAnimationFrame as some libraries expect it if
// requestAnimationFrame is available
global.cancelAnimationFrame = function(id) {
  return clearTimeout(id);
};

// eslint-disable-next-line global-require
const Enzyme = require('enzyme');
// eslint-disable-next-line global-require
const EnzymeReactAdapter = require('enzyme-adapter-react-16');

Enzyme.configure({ adapter: new EnzymeReactAdapter() });
