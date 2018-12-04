#!/usr/bin/env node
const mapValues = require('lodash/mapValues');
const { writeFileSync } = require('fs');
const muster = require('@dws/muster');

const getObjectDescriptor = (obj) => {
  if (typeof obj === 'function') {
    const functionStr = obj.toString().match(/function\s.*?\(([^)]*)\)/);
    const args = functionStr ? functionStr[1] : '';
    return {
      type: 'Function',
      args: args.split(',').map((arg) => (
        arg.replace(/\/\*.*\*\//, '').trim()
      )).filter((arg) => arg),
    }
  }
  if (typeof obj === 'object' && !obj) {
    if (muster.isNodeType(obj)) return { type: 'Module' };
  }
  return { type: 'Variable' };
};

let musterDescriptors = mapValues(muster, getObjectDescriptor);
writeFileSync('./type-definition/types.json', JSON.stringify(musterDescriptors));

