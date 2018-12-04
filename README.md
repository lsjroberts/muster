# Muster

![Muster Logo](./packages/website/static/img/muster.svg)

```bash
yarn
```

This is the monorepo for muster and muster-* packages.

It is managed by [Lerna](https://github.com/lerna/lerna/). Which helps to run commands across packages and manage versions.

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

See [CONTRIBUTING.md](./CONTRIBUTING.md) for details.
