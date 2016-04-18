# Zappr

*Enhance your GitHub workflow*

[![Build Status](https://travis-ci.org/zalando/zappr.svg?branch=master)](https://travis-ci.org/zalando/zappr)
[![Codacy Badge](https://api.codacy.com/project/badge/grade/a4ff87e159124b6d9fd991cc184d268e)](https://www.codacy.com/app/max-fellner/zappr)
[![Dependencies](https://david-dm.org/zalando/zappr.svg)](https://david-dm.org/zalando/zappr)

Zappr is a GitHub integration built to enhance your project workflow. Built by open-source enthusiasts,
it's aimed at helping developers to increase productivity and improve open-source project quality.
It does this primarily by removing bottlenecks around pull request approval and helping project owners to
halt "rogue" pull requests before they're merged into the master branch.

## Features

- you can enable/disable approval checks per repository, with the simple flip of a toggle
- you can configure what counts an approval and what doesn’t
- via a text-based user configuration file that you insert in your repository, you can override GitHub's default settings and endow users with PR approval authorization by inviting them by name, organization and/or contributor status.

## Why We Developed Zappr

### Code Review

Zappr is our attempt to restore and improve code review to the process of developing a project on GitHub.
GitHub doesn't impose restrictions on project contributions. While great for openness, this can pose challenges
for project developers who want contributors to follow certain guidelines. This challenge is noted in the
"[Dear GitHub](https://github.com/dear-github/dear-github)" letter that went viral in 2015.

### Compliance

We are proponents of being able to do as much work as possible in GitHub, using GitHub. When working with
compliance requirements, however, this can get tricky: how can devs employ the four-eyes principle in GitHub?
Zappr aims to address this by applying a review/approval function to project workflow at a critical point of transition.

### No More Bottlenecks

We think it could be very useful for larger open-source projects that can't rely on a handful of admins to
handle all PRs without sacrificing quality control.

## Technical Requirements

This is easy: All you need is a GitHub username. No setup is required. To start using Zappr on a specific project,
you *do* have to opt-in as a project/repo owner. Then you're set.



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
npm run build-client -- -d
npm run build-server -- -d
npm run run-all
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

```
./tools/build.sh
```

## Contributing to Zappr
Please read our [contributor guidelines](https://github.com/zalando/zappr/blob/master/CONTRIBUTING.md) for more details.
And please check [these open issues](https://github.com/zalando/zappr/issues) for specific tasks.

## Documentation

We're developing additional documentation [here](doc/readme.md). Check back for updates.

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
