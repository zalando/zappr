# Run Your Own Zappr

So, you want to run your own Zappr because you too have GitHub Enterprise—or you just don't want to use [Zappr Opensource](https://zappr.opensource.zalan.do) for whatever reason. That's fine. Here's what you need (**M**andatory/**R**ecommended/**O**ptional):

* **(M)** A GitHub. This might be a GitHub Enterprise instance, or you can use the public GitHub.
* **(M)** A PostgreSQL database.
* **(M)** Servers on which you can run Docker containers or JavaScript.
* **(R)** A proper/not self-signed certificate, so that GitHub can verify the SSL connection.
* **(O)** A load balancer, if you want to run Zappr on multiple nodes.
* **(O)** For encrypting tokens stored in the database, we use [KMS](https://aws.amazon.com/kms/). If that's not an option, you will have to implement the [EncryptionService interface](https://github.com/zalando/zappr/blob/master/server/service/encryption/NullEncryptionService.js) and make sure it can be created via the [EncryptionServiceCreator](https://github.com/zalando/zappr/blob/master/server/service/EncryptionServiceCreator.js).

## Got it! I have everything now. What next?

We need to build the code!

All configuration is contained in a single file `config/config.yaml`. Put the necessary configuration options in there, 
they are explained in the next section. Remember you can override them with environment variables as you wish.

We host a Zappr base image at `registry.opensource.zalan.do/opensource/zappr`, for which you only need to add your configuration.
See `Dockerfile.external` in the repository as an example.

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

### Database (Postgres)
 
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
