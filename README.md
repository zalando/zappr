![zappr](client/img/banner_tiny.png)

**Approval checks for GitHub pull requests.**

[![Build Status](https://travis-ci.org/zalando/zappr.svg?branch=master)](https://travis-ci.org/zalando/zappr)
[![Code Climate](https://codeclimate.com/github/zalando/zappr/badges/gpa.svg)](https://codeclimate.com/github/zalando/zappr)
[![Dependencies](https://david-dm.org/zalando/zappr.svg)](https://david-dm.org/zalando/zappr)
[![Gitter](https://badges.gitter.im/zalando/zappr.svg)](https://gitter.im/zalando/zappr)

Zappr is a GitHub integration built to enhance your project workflow. Built by open-source enthusiasts,
it's aimed at helping developers to increase productivity and improve open-source project quality.
It does this primarily by removing bottlenecks around pull request approval and helping project owners to
halt "rogue" pull requests before they're merged into the master branch.

### Setup, FAQ and further information

Please refer to [our documentation](https://zappr.readthedocs.org/).

### Local Development
  
We assume you want to set up the development environment first. If you want to test your application, check the Test section below.  
In the end you will have three different processes running:
- Your local PostgreSQL database
- Your local Zappr application
- a VPN tunnel (e.g.: localtunnel) exposing your localhost  

**Before you start** you need to register an OAuth application in your GitHub account under `Settings/ Developer Settings/ OAuth Apps`.   
If you need help in registering your application follow these [instructions](https://auth0.com/docs/connections/social/github).
You will need 
- the `Client ID` 
- the `Client Secret` and 
- the `Authorization callback URL`   

from your registered application later.  
In case you use localtunnel as your VPN, set the `Authorization callback URL` in your GitHub settings to `https://<your-app-name>.localtunnel.me`.

#### Database Setup
Zappr needs a database during development and testing. For this reason there's a `docker-compose.yaml` 
for your convenience, with which you can either start a database for development (`postgres-dev`) **or** testing: (`postgres-test`).  
Since dev and test database share the same port, you should either change the port of one of the databases or comment out in the `docker-compose.yaml` 
the database you currently don't need.  

Make sure your docker machine host is running:

~~~ shell
 docker-machine start
~~~  

Start database and schemas:
~~~ shell
export DB_HOST="$(docker-machine ip)"  

# Starts the postgres docker container for development & test purposes
# run either
docker-compose up postgres-dev
# or
docker-compose up postgres-test 

# creates database and schemas, only needed first time
# run it database command in additional terminal session
./init_db.sh


~~~
To get your docker-machine ip you can also run `docker-machine ip` in the shell and copy the address.  

#### Zappr Setup

To get your `GITHUB_CLIENT_ID` and `GITHUB_CLIENT_SECRET` copy it from your Github `Settings/ Developer Settings/ OAuth Apps` or 
create them new following these [instructions](https://auth0.com/docs/connections/social/github). 
Export your [Github credentials](https://github.com/settings/applications) and docker-machine IP:

~~~ shell
export DM_IP="$(docker-machine ip)"
export GITHUB_CLIENT_ID=<your-client-id>
export GITHUB_CLIENT_SECRET=<your-client-secret>
~~~

Start Zappr with any of the following alternatives  
- Using NPM:  
~~~ shell
npm install
npm run build
GITHUB_CLIENT_ID=<your-client-id> GITHUB_CLIENT_SECRET=<your-client-secret> HOST_ADDR=https://<your-app-name>.localtunnel.me/ npm run all
~~~
- Using docker compose:    
~~~ shell
docker-compose up
~~~


You can also set the `GITHUB_CLIENT_ID`, the `GITHUB_CLIENT_SECRET` and the `HOST_ADDR` in your `config/config.yaml` or add it 
to the package.json script.
However we do not advise it since you could end up pushing your ID and Secret to GitHub.  

#### VPN Setup
Install and run localtunnel to expose your localhost
~~~ shell
npm i -g localtunnel
lt -s <your-app-name> -p 3000
~~~

Double check that your Authorization callback URL is set to `https://<your-app-name>.localtunnel.me` in the GitHub settings.

Go to `https://<your-app-name>.localtunnel.me` and do things :)

#### Debug Client and Server:

```
npm run build
GITHUB_CLIENT_ID=<your-client-id> GITHUB_CLIENT_SECRET=<your-client-secret> HOST_ADDR=https://<your-app-name>.localtunnel.me/ npm run all
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

#### Test:  
_Note:_ If you want to run tests with local setup please change the local running port of your test database in `docker-compose.yaml`.  

First start the testing database:

~~~ shell
export DB_HOST="$(docker-machine ip)"

# creates database and schemas, only needed first time
./init_db.sh

# start postgres docker container
docker-compose up postgres-test
~~~

Then you can do:

* `npm test` - run combined tests
* `npm run test-client` - run only client tests
* `npm run test-server` - run only server tests
* `npm run test-karma` - run Karma (UI) tests

#### Docker Image:

1. Check out `master` and clean up your `git status`
2. Run the build script:

        ./tools/build.sh (<tag>)

* `NPM_BUILD_INSIDE_CONTAINER` "true" to build inside a container
* `DOCKER_ARTIFACT_FILE` file to store docker artifact name in

#### Trouble shooting:

##### No default docker machine
Error:
~~~ shell
$ docker-machine start
Error: No machine name(s) specified and no "default" machine exists
~~~

Workaround:
~~~ shell
# docker-machine create -d "[driver]" [label]
# e.g.
docker-machine create -d "virtualbox" default
~~~

##### Can't connect to docker deamon
Error:
~~~ shell
$ ./init_db.sh
Set up dev database
Cannot connect to the Docker daemon at unix:///var/run/docker.sock. Is the docker daemon running?
...
Set up test database
Cannot connect to the Docker daemon at unix:///var/run/docker.sock. Is the docker daemon running?
...
~~~

Workaround:
~~~ shell
eval "$(docker-machine env default)"
~~~

##### Container zappr-postgres-dev or zappr-postgres-test missing
Error:
~~~ shell
$ ./init_db.sh
...
Error: No such container: zappr-postgres-dev
...
Error: No such container: zappr-postgres-test
~~~

Workaround:
run one of:
~~~ shell
docker-compose up postgres-dev
docker-compose up postgres-test
~~~
to create the missing container

##### Can not start zappr-postgres-dev or zappr-postgres-test service
Error:
~~~ shell
$ docker-compose up postgres-dev|test
ERROR: for zappr-postgres-dev  Cannot start service postgres-dev|test: driver failed
...
~~~

Workaround:
do run **either**
~~~ shell
docker-compose up postgres-dev
~~~
**or**
~~~ shell
docker-compose up postgres-test
~~~
at the same time in different terminal sessions.


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
