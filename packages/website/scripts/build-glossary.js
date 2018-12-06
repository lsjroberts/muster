#!/usr/bin/env node
const { writeFileSync } = require('fs');
const path = require('path');
const startCase = require('lodash/startCase');
const sortBy = require('lodash/sortBy');

const GLOSSARY_JSON_LOCATION = '../static/js/glossary.json';
const MARKDOWN_OUTPUT_LOCATION = '../docs/glossary.md';

const header = `---
id: glossary
title: Glossary
---

Find descriptions of Muster terminology below.`;

function getItemTemplate({ id, description, action, scope }) {
  return `

## ${startCase(id)}

<span class="scope-tag">${scope}</span> ${description}

${action ? '> ' + action : ''}`;
}

function main() {
  console.log('Writing glossary...');
  const terms = require(GLOSSARY_JSON_LOCATION).terms;
  console.log(`  ${terms.length} entries`);
  const itemTemplates = sortBy(terms, 'id').map(getItemTemplate);
  const markdown = header + itemTemplates.join('');
  writeFileSync(path.join(__dirname, MARKDOWN_OUTPUT_LOCATION), markdown);
  console.log('...done.');
}

main();
