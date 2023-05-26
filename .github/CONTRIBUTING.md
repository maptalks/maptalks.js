# Contributing Guide

Hi! It's really really exciting that you are interested in contributing to maptalks.js. Before submitting your contribution though, please make sure to take a moment and read through the following guidelines.

- [Code of Conduct](https://github.com/maptalks/maptalks.js/blob/master/CODE_OF_CONDUCT.md)
- [Pull Request Guidelines](#pull-request-guidelines)
- [Development Setup](#development-setup)
- [CI Tests](#ci-tests)
- [Project Structure](#project-structure)

## Pull Request Guidelines

- Submit your PRs against the `master` branch.

- **DO NOT** check in `dist` in the commits.

- Make sure `npm test` passes. (see [development setup](#development-setup))

- If adding new feature:
  - Add accompanying test case.

- If fixing a bug:
  - If you are resolving a special issue, add `(fix #xxxx[,#xxx])` (#xxxx is the issue id) in your PR title for a better release log, e.g. `fix map's zooming (fix #666)`.
  - Provide detailed description of the bug in the PR. Live demo preferred.
  - Add appropriate test coverage if applicable.

## Development Setup

You will need [Node.js](http://nodejs.org) **version 6+** and [Google chrome](https://www.google.com/chrome/) (needed for running tests).

After cloning the repo, run:

``` bash
$ npm install
```

### Commonly used NPM scripts

``` bash
# watch and auto re-build dist/maptalks.js
$ npm run dev

# build all dist files, including npm packages
$ npm run build

# run the full test suite with coverage, include linting
# test command on CI servers
$ npm test

# watch and auto re-run unit tests in Chrome
$ gulp tdd

# watch and auto re-run unit tests matching the pattern
# See https://mochajs.org/#-g---grep-pattern
$ gulp tdd --pattern "Map.Spec"

# watch and auto re-run unit tests in firefox developer edition, IE11 and IE10
# Available browsers: 
# Chromes in https://github.com/karma-runner/karma-chrome-launcher
# Firefoxes in https://github.com/karma-runner/karma-firefox-launcher
# IE: IE, IE10
$ gulp tdd --browsers FirefoxDeveloper,IE,IE10

# watch and auto re-run unit tests matching the pattern in firefox developer edition
$ gulp tdd --pattern "Map.Spec" --browsers FirefoxDeveloper

# run the full test suite, without coverage and linting
$ gulp test --pattern "Map.Spec" --browsers FirefoxDeveloper

# run lint check with ESLint
$ npm run lint
```

The default test script will do the following: lint with ESLint -> unit tests. **Please make sure to have this pass successfully before submitting a PR.** Although the same tests will be run against your PR on the CI servers, it is better to have it working locally beforehand.

## CI Tests
maptalks's unit tests are run in the following CI servers:
* **[CircleCI](https://circleci.com/gh/maptalks/maptalks.js)**: run tests on Chrome
* **[AppVeyor](https://ci.appveyor.com/project/fuzhenn/maptalks-js)**: run tests on IE11 and IE10 (emulated by "x-ua-compatible")
* **[Travis-ci](https://travis-ci.org/maptalks/maptalks.js)**: run tests on latest Firefox

Common causes of CI failures:
* If your PR failes in one or two CI tests but succeeds in the others, it usually indicated a browser compatible problem. 
* If testing fails due to "timeout of 2000ms exceeded" errors in several cases which was passed in the previous testings, it's possible caused by server glitches and you can try to push more commits to trigger a re-testing.
* Only failure of appveor may be caused by ES6 codes in unit tests, tests must be written in **ES5** as IE doesn't support ES2015 grammar.

## Project Structure

- **`assets`**: CSS sources and image resources.

- **`build`**: contains build-related configuration files. In most cases you don't need to touch them. However, it would be helpful to familiarize yourself with the following files:

  - `build/alias.js`: module import aliases used across all source code.

  - `build/karma.*.js`: karma configs for different testing targets.

  - `build/rollup.config.js` : rollup config for packaging.

- **`debug`**: contains manual tests untestable in unit tests.

- **`docs`**: contains api docs. The publishing folder for github pages.

- **`src`**: contains the source code, obviously. The codebase is written in ES2015.

- **`test`**: contains all tests written in **ES5**(for compatibility of IE). The unit tests are written with [Mocha](https://mochajs.org), [expect.js](https://github.com/Automattic/expect.js) for assertion, [happen](https://github.com/tmcw/happen) for event mocking and run with [Karma](http://karma-runner.github.io/0.13/index.html).
