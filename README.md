![zappr](https://cloud.githubusercontent.com/assets/1183636/12652806/eded78d0-c5ec-11e5-9736-0b2a75dfd8ab.png)

*Approval checks for GitHub pull requests.*

[![Build Status](https://travis-ci.org/zalando/zappr.svg?branch=master)](https://travis-ci.org/zalando/zappr)
[![Codacy Badge](https://api.codacy.com/project/badge/grade/a4ff87e159124b6d9fd991cc184d268e)](https://www.codacy.com/app/max-fellner/zappr)
[![Dependencies](https://david-dm.org/zalando/zappr.svg)](https://david-dm.org/zalando/zappr)

Zappr is a GitHub integration built to enhance your project workflow. Built by open-source enthusiasts,
it's aimed at helping developers to increase productivity and improve open-source project quality.
It does this primarily by removing bottlenecks around pull request approval and helping project owners to
halt "rogue" pull requests before they're merged into the master branch.

### Setup, FAQ and further information

Please refer to [our documentation](https://zappr.rtfd.org/).

### Development

Export your [Github credentials](https://github.com/settings/applications):

```
export GITHUB_CLIENT_ID=<your-client-id>
export GITHUB_CLIENT_SECRET=<your-client-secret>
```

**Build and Run:**

```
npm install
npm run build
npm start
```

**Debug Client and Server:**

```
npm run build
npm run all
```

Enable debug logs...

...in the terminal:

```
export DEBUG="zappr:*"
```

...in the browser console:

```
window.DEBUG.enable('zappr:*')
```

**Test:**

* `npm test` - run combined tests
* `npm run test-client` - run only client tests
* `npm run test-server` - run only server tests
* `npm run test-karma` - run Karma (UI) tests

**Docker Image:**

1. Check out `master` and clean up your `git status`
2. Run the build script:

        ./tools/build.sh (<tag>)

* `NPM_BUILD_INSIDE_CONTAINER` "true" to build inside a container
* `DOCKER_ARTIFACT_FILE` file to store docker artifact name in


## Contributing to Zappr
Please read our [contributor guidelines](https://github.com/zalando/zappr/blob/master/CONTRIBUTING.md) for more details.
And please check [these open issues](https://github.com/zalando/zappr/issues) for specific tasks.

## License

The MIT License (MIT)

Copyright (c) 2016 Zalando SE

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
