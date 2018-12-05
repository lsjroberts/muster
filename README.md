# Muster

![Muster Logo](./packages/website/static/img/muster.svg =300x300)

> A universal data layer for components and services
>
> https://dwstech.github.io/muster

This is the monorepo for muster and muster-* packages.

[![CircleCI](https://circleci.com/gh/dwstech/muster.svg?style=svg)](https://circleci.com/gh/dwstech/muster)
[![Known Vulnerabilities](https://snyk.io/test/github/dwstech/muster/badge.svg?targetFile=package.json)](https://snyk.io/test/github/dwstech/muster?targetFile=package.json)
[![lerna](https://img.shields.io/badge/maintained%20with-lerna-cc00ff.svg)](https://lernajs.io/)

## Usage

The packages are published as separate NPM packages, so can be installed and imported separately.

```bash
npm install @dws/muster
npm install @dws/muster-react

yarn add @dws/muster @dws/muster-react
```

```javascript
import muster from '@dws/muster';
import { container } from '@dws/muster-react';
```

### Development

```bash
yarn
```

See [CONTRIBUTING.md](./CONTRIBUTING.md) for details.
