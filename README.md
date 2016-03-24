![zappr](https://cloud.githubusercontent.com/assets/1183636/12652806/eded78d0-c5ec-11e5-9736-0b2a75dfd8ab.png)

*Approval checks for GitHub pull requests.*

[![Build Status](https://travis-ci.org/zalando/zappr.svg?branch=master)](https://travis-ci.org/zalando/zappr)
[![Codacy Badge](https://api.codacy.com/project/badge/grade/a4ff87e159124b6d9fd991cc184d268e)](https://www.codacy.com/app/max-fellner/zappr)
[![Dependencies](https://david-dm.org/zalando/zappr.svg)](https://david-dm.org/zalando/zappr)

***

##Zappr: Enhance your GitHub pull-request workflow 

Zappr is a GitHub integration built to enhance your project workflow. Built by open-source enthusiasts, it's aimed at helping developers to increase productivity and improve open-source project quality. It does this primarily by removing bottlenecks around pull request approval and helping project owners to halt "rogue" pull requests before they're merged into the master branch.

Zappr Features:
- you can apply it and enable/disable approval checks per repository, with the simple flip of a toggle
- you can configure what counts an approval and what doesn’t
- via a text-based user configuration file that you insert in your repository, you can override GitHub's default settings and endow users with PR approval authorization by inviting them by name, organization and/or contributor status. 

###Why We Developed Zappr
GitHub is generally very open to contributions, in that it doesn’t impose restrictions on work flows. While great for establishing openness, this can pose challenges for project developers who want contributors to follow certain protocols/contributor guidelines. This challenge is noted in the "[Dear GitHub](https://github.com/dear-github/dear-github)" letter that went viral in 2015. Zappr is our attempt to restore and improve code review to the process of developing a project on GitHub.

We are proponents of being able to do as much work as possible in GitHub, using GitHub. When working with compliance requirements, this can get tricky: how can devs employ the four-eyes principle in GitHub? Zappr aims to address this by applying a review/approval function to project workflow at a critical point of transition. We think it could be very useful for larger open-source projects that can't rely on a handful of admins to handle all PRs without sacrificing quality control. 

### Technical Requirements
This is easy: All you need is a GitHub username. No setup is required. To start using Zappr on a specific project, you *do* have to opt-in as a project/repo owner. Then you're set.

### Setup and Running Zappr
1. Using your GitHub account, log in to Zappr [here](https://zappr.opensource.zalan.do/login). 
2. Authorize the application and type in your password to export your [GitHub credentials](https://github.com/settings/applications)
3. You'll see a dashboard with all of your repositories listed in a column at left. Scroll all the way down to the bottom of this column and click the blue "Sync with GitHub button." (You will only need to do this whenever you add new repositories to your GitHub account.) 
4. To enable Zappr on a specific repository, use the search function. You'll get a screen like this:

[include screenshot]
5. Switch the toggle to "On." At this time, you can customize your configuration by adding a zappr.yml file to your repository. 


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

## Contributing to Zappr
Please read our [contributor guidelines](https://github.com/zalando/zappr/blob/master/CONTRIBUTING.md) for more details. And please check [these open issues](https://github.com/zalando/zappr/issues) for specific tasks.  

## Documentation

We're developing additional documentation [here](doc/readme.md). Check back for updates.

## License
