<img src="packages/website/static/img/muster.svg" alt="Muster Logo" width="300" height="300" />

# Muster &middot; [![CircleCI](https://circleci.com/gh/dwstech/muster.svg?style=shield)](https://circleci.com/gh/dwstech/muster) [![Known Vulnerabilities](https://snyk.io/test/github/dwstech/muster/badge.svg?targetFile=package.json)](https://snyk.io/test/github/dwstech/muster?targetFile=package.json)  [![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg?style=flat-square)](http://makeapullrequest.com) [![GitHub license](https://img.shields.io/badge/license-MIT-blue.svg?style=flat-square)](https://github.com/dwstech/muster/blob/develop/LICENSE) [![lerna](https://img.shields.io/badge/maintained%20with-lerna-cc00ff.svg?style=flat-square)](https://lernajs.io/)

> A universal data layer for components and services
>
> https://dwstech.github.io/muster/

This is the monorepo for muster and muster-* packages.

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

## Licence

[MIT](./LICENCE)
