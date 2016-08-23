# Run Your Own Zappr

So, you want to run your own Zappr because you too have GitHub Enterprise—or you just don't want to use [Zappr Opensource](https://zappr.opensource.zalan.do) for whatever reason. That's fine. Here's what you need (**M**andatory/**R**ecommended/**O**ptional):

* **(M)** A GitHub. This might be a GitHub Enterprise instance, or you can use the public GitHub.
* **(M)** A PostgreSQL database. You can use SQLite out of the box too, but we don't recommend it for production. 🙃 Zappr uses [sequelize](http://docs.sequelizejs.com/en/latest/) as an ORM. You could possibly use just a different database driver, but this is at your own risk as an ORM can never *completely* abstract database details away.
* **(M)** Servers on which you can run Docker containers or JavaScript.
* **(R)** A proper/not self-signed certificate, so that GitHub can verify the SSL connection.
* **(O)** A load balancer, if you want to run Zappr on multiple nodes.
* **(O)** For encrypting tokens stored in the database, we use [KMS](https://aws.amazon.com/kms/). If that's not an option, you will have to implement the [EncryptionService interface](https://github.com/zalando/zappr/blob/master/server/service/encryption/NullEncryptionService.js) and make sure it can be created via the [EncryptionServiceCreator](https://github.com/zalando/zappr/blob/master/server/service/EncryptionServiceCreator.js).

## Got it! I have everything now. What next?

We need to build the code!

The configuration is split into two parts: 

- `config/system.yaml` holds system configuration, such as the session secret to use, GitHub URLs, the database driver, and connection settings etc.
- `config/app.yaml` (not in the repo, because we create that on build time) contains the default Zappr config that will be used when Zapprfiles are missing config options. Example configuration can be found e.g. in `config/app-enterprise.yaml`.

Usually you will enter your desired Zappr default configuration in `config/app.yaml` and leave the system configuration as-is, overriding it via environment variables.

So, you have your configuration in place. Great! Now we build everything with:

    # on local machine
    # install dev dependencies
    npm install
    # build zappr code
    npm run dist

Copy the folders `config`, `dist`, `migrations` and the `package.json` file to your server. Then do this:

    # on server
    # install dependencies
    npm install --production && npm install pg source-map
    # export all configuration environment variables
    export DB_DRIVER=postgres
    # start zappr
    npm start
    
You can also just build the Docker image with `docker build -f Dockerfile.external -t zappr .` and run it, providing your environment config via `-e DB_DRIVER=postgres` and so on. We don't yet provide ready-to-use images, but we will do so in the future.

## Configuration options

Zappr provides a whole lot of configuration options for flexibility.

### Github

* `GITHUB_CLIENT_ID`: Client ID of your OAuth application in Github
* `GITHUB_CLIENT_SECRET`: Client secret of your OAuth application in Github
* `GITHUB_HOOK_SECRET`: Secret value used to verify only Github calls Zappr
* `GITHUB_UI`: URL to Github web user interface
* `GITHUB_API_URL`: URL to Github API

### Server

* `SESSION_SECRET`: Secret to use for session cookie
* `HOST_ADDR`: Address of Zappr itself (used e.g. as redirect URI in OAuth flow)
* `APP_PORT`: Port on which Zappr runs
* `METRICS_PORT`: Port on which metrics are served
* `METRICS_ENABLED`: Whether to serve metrics or not
* `STATIC_DIR`: Where to find static assets
* `LOG_LEVEL`: Desired amount of logging, can be `info` or `debug`

### Database

* `DB_DRIVER`: Which database to use, either `sqlite` or `postgres`

#### SQLite

* `SQLITE_FILE`: Path to SQLite file

#### Postgres
 
* `DB_HOST`: DNS/IP of database server
* `DB_PORT`: Port where database server listens, usually `5432`
* `DB_USER`: Database user, might be `postgres` or you create a different user (recommended)
* `DB_PASS`: Password for database user
* `DB_NAME`: Which database to use

### Encryption

* `ENCRYPTION_ENGINE`: `~` for none, `kms` for encryption with AWS KMS

#### KMS

* `ENCRYPTION_KEY`: ARN of the key to use for encrypting access tokens
* `KMS_REGION`: Region this key is located in

### Audit logs

* `AUDIT_SHIP_ENGINE`: Where to ship the audit logs to. Can be `console`, `file` or `zalando-audit-trail` (not for public use)
* `AUDIT_TRANSFORM_ENGINE`: How the shipped logs should look like. Can be `identity` or `zalando-audit-trail` (not for public use)
* `AUDIT_RELEVANT_ORGS`: Array of organisations that you want to audit. If it's not an array, everything will be logged.

#### File shipper

The file shipper uses [`winston.transports.File`](https://github.com/winstonjs/winston/blob/master/docs/transports.md#file-transport), please look there for a more detailed documentation.

* `AUDIT_FILE_NAME`: Filename where audit logs go to, defaults to `audit.log`
* `AUDIT_MAX_SIZE`: Maximum size of a single audit file, defaults to 10 MB
* `AUDIT_MAX_FILES`: How many files to keep around, defaults to 3

#### Zalando Audit Trail Shipper (not for public use)

* `AUDIT_TRAIL_API_URL`: URL of the Zalando Audit Trail API

### Zappr

Don't put these in environment variables as they are expected to be objects/arrays inside the application.

* `VALID_ZAPPR_FILE_PATHS`: Which paths to fetch from a repository when looking for a Zapprfile
* `VALID_PR_TEMPLATE_PATHS`: Which paths to fetch from a repository when looking for a pull request template
* `ZAPPR_DEFAULT_CONFIG`: Default configuration. Will be used as-is if no Zapprfile is in the repository or will be merged with Zapprfile. 
