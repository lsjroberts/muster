# Contributing

To get started, <a href="https://www.clahub.com/agreements/dwstech/muster">sign the Contributor License Agreement</a>.

> Please note that this project is released with a [Contributor Code of Conduct](./CODE_OF_CONDUCT.md).
> By participating in this project you agree to abide by its terms.

First, ensure you have the [latest `yarn`](https://yarnpkg.com/).

To get started with the repo:

```sh
$ git clone git@github.com:dwstech/muster.git && cd muster
$ yarn
```

## Code Structure

Muster and its packages are written in TypeScript. As this is a monorepo, all source lives under `/packages`. Tests are written written in TypeScript and co-located with their source. Source is annotated with TypeDoc comments with examples inline. Most packages compile to an ES5 `dist`, an ES6 `esm` and an occasional UMD `_bundle`.

## Commands

### Run Unit Tests

```sh
$ yarn test

# watch for changes
$ yarn test -- --watch
```

### Linting

```sh
$ yarn lint
```

### Coverage

If you would like to check test coverage, run the coverage script, then open
`coverage/lcov-report/index.html` in your favorite browser.

```sh
$ yarn test:coverage

# OS X
$ open coverage/lcov-report/index.html

# Linux
$ xdg-open coverage/lcov-report/index.html
```

## Changelog

When making changes, record them in the `CHANGELOG.md`. Add all changes under the `## Unreleased` heading, grouped into one of:

```
### 💥 Breaking Changes
### 🚀 New Features
### 🔧 Refactors
### 🐛 Bug Fixes
### 🚨 Deprecations
### 📝 Documentation
### 💅 Polish
```

Changes should be written as past tense actions, e.g. `Added ...`, `Removed ...` etc.

**Note:** You do not need to log every little change, only changes that are going to have an impact on users of the library. Use past tense descriptions and include small code examples for new features and api changes.

## Releases

Releases are performed by creating a `release` branch from `develop` to `master`. After creating a release branch, you should run:

```bash
yarn new-version
```
Set the new version based on the `Unreleased` content of the changelog. Breaking changes = major version, New feature = minor version, anything else = patch.

You'll then need to add the Release header to the changelog, in the format:

```markdown
## x.x.x (yyyy-mm-dd)
```

Finally, you'll need to version the API docs then version and build the website.

```bash
yarn version-docs # creates a version of the api docs under /api/$version
yarn copy:changelog # copies the updated changelog into the website dir
cd packages/website
yarn new-version
yarn start # runs the new website version and updates the i18n files
```

Then commit these changes and tag them with the version number.

```bash
git tag x.x.x
```

Push the branch and the tag to origin and open a PR targeting `master`. When the PR is approved and merged, the new versions will be published automatically by CI.
