#!/usr/bin/env node
/* eslint-disable no-console */
/**
 * Watch files for changes and rebuild (copy from 'src/' to `dist/`) if changed
 */

const fs = require('fs');
const path = require('path');
const execSync = require('child_process').execSync;

const packages = require('./packages');

const BUILD_CMD = `node ${path.resolve(__dirname, './build.js')}`;
const PACKAGES_DIR = path.resolve(__dirname, '../packages');

let filesToBuild = new Map();

function fileExists(filename) {
  try {
    return fs.statSync(filename).isFile();
  } catch (e) {
    // don't do anything
  }
  return false;
}

function rebuildFile(filename) {
  filesToBuild.set(filename, true);
}

packages.forEach((pkg) => {
  const srcDir = path.resolve(PACKAGES_DIR, pkg, 'src');
  try {
    fs.accessSync(srcDir, fs.F_OK);
    fs.watch(srcDir, { recursive: true }, (event, filename) => {
      const filePath = path.resolve(srcDir, filename);

      if (
        (event === 'change' || event === 'rename') &&
        fileExists(filePath)
      ) {
        console.log(`-> ${event}: ${filename}`);
        rebuildFile(filePath);
      } else {
        const buildFile = path.resolve(srcDir, '..', 'dist', filename);
        try {
          fs.unlinkSync(buildFile);
          process.stdout.write(
            `${path.relative(path.resolve(srcDir, '..', '..'), buildFile)} (deleted)\n`
          );
        } catch (e) {
          // pass
        }
      }
    });
  } catch (e) {
    // doesn't exist
    console.error(`Package \`${pkg}\` doesn't have a \`src\` folder`);
  }
});

setInterval(() => {
  const files = Array.from(filesToBuild.keys());
  if (files.length) {
    filesToBuild = new Map();
    try {
      execSync(`${BUILD_CMD} ${files.join(' ')}`, { stdio: [0, 1, 2] });
    } catch (e) {
      // pass
    }
  }
}, 100);

console.log('-> Watching for changes...');
