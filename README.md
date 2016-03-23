![zappr](https://cloud.githubusercontent.com/assets/1183636/12652806/eded78d0-c5ec-11e5-9736-0b2a75dfd8ab.png)

*Approvals for Github pull requests.*

[![Build Status](https://travis-ci.org/zalando/zappr.svg?branch=master)](https://travis-ci.org/zalando/zappr)
[![Codacy Badge](https://api.codacy.com/project/badge/grade/a4ff87e159124b6d9fd991cc184d268e)](https://www.codacy.com/app/max-fellner/zappr)
[![Dependencies](https://david-dm.org/zalando/zappr.svg)](https://david-dm.org/zalando/zappr)

***

##Zappr: Enhance your GitHub pull-request workflow 

Zappr is a GitHub integration built to enhance your open-source project workflow. Built by open-source enthusiasts, it's aimed at helping developers to increase productivity and improve project quality. It does this by removing bottlenecks around pull-request approval, and by helping project owners to prevent "rogue" pull requests from being merged into a project's master branch.

Zappr uses a text-based user configuration file that you inserted in your repository. With this file, you can override GitHub's default settings and endow users with PR approval authorization by inviting them by name, organization and/or contributor status. 

Zappr Features:
- you can enable it per repository
- you can configure what counts an approval and what doesn’t
- you can enable or disable approval checks with the flip of a toggle

###Why We Developed Zappr
GitHub is generally very open to contributions — it doesn’t impose restrictions on work flows. While this is great for establishing project openness, it poses challenges for project developers who want to follow certain protocols — i.e., what you might find in a set of contributor guidelines.  

Also, we are proponents of being able to do as much work as possible in GitHub, using GitHub. When working with compliance requirements, this can get tricky: how to employ the four-eyes principle in GitHub? Zappr aims to address this by applying a review/approval function to project workflow at a critical point of transition.   

### Technical Requirements
This is easy: All you need is a GitHub username. No setup required. To start using Zappr on a specific project, you do have to opt-in as a project/repo owner. Then you're set.

### Development

Export your [Github credentials](https://github.com/settings/applications):

```
export GITHUB_CLIENT_ID=<your-client-id>
export GITHUB_CLIENT_SECRET=<your-client-secret>
```

**Build & run:**

```
npm install
npm run build
npm start
```

**Debug client & server:**

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

**Docker image:**

```
./tools/build.sh
```

## Documentation

You can find the documentation [here](doc/readme.md).
