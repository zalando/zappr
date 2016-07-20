# Run your own Zappr

So you want to run your own Zappr because you too have Github Enterprise or... just don't want to use [Zappr Opensource](https://zappr.opensource.zalan.do). That's fine. Here's what you need (**M**andatory/**R**ecommended/**O**ptional):

* **(M)** A Github. This might be a Github Enterprise instance or you can use the public Github.
* **(M)** A Postgres database. You can use SQLite out of the box too, but we don't recommend it for production. 🙃 We're using [sequelize](http://docs.sequelizejs.com/en/latest/) as ORM, so you could maybe just use a different database driver, but this is at your own risk as an ORM can never abstract database details away completely.
* **(M)** Servers where you can run Docker containers or Javascript. There's a `Dockerfile` we use, but you can get away without it.
* **(R)** A proper, not self-signed certificate because you want Github to verify the SSL connection.
* **(O)** A load balancer if you want to run Zappr on multiple nodes.
* **(O)** For encrypting tokens stored in the database we use [KMS](https://aws.amazon.com/kms/). If that's not an option you will have to implement the [EncryptionService interface](https://github.com/zalando/zappr/blob/master/server/service/encryption/NullEncryptionService.js) and make sure it can be created via the [EncryptionServiceCreator](https://github.com/zalando/zappr/blob/master/server/service/EncryptionServiceCreator.js).

## Got it, everything is there. What next?

We need to build the code!

The configuration is split in two parts: `config/system.yaml` holds system configuration like session secret to use, Github URLs, database driver and connection settings etc. `config/app.yaml` (not in the repo as we're creating that on build time) contains the default Zappr config that will be used when Zapprfiles are missing config options. (Take as an example `config/app-enterprise.yaml`.) Usually you will enter your desired Zappr default configuration in `config/app.yaml` and leave the system configuration as-is, overriding it via environment variables.

So you have your configuration in place. Now we build everything with:

    # on local machine
    # install dev dependencies
    npm install
    # build zappr code
    npm run dist

Copy the folders `config`, `dist`, `migrations` and the `package.json` file to your server. Then do there:

    # on server
    # install dependencies
    npm install --production && npm install pg source-map
    # export all configuration environment variables
    export DB_DRIVER=postgres
    # start zappr
    npm start
    
Or just build the Docker image with `docker build -f Dockerfile.external -t zappr .` and run that one (providing environment config via `-e DB_DRIVER=postgres` and so on. We don't yet provide ready-to-use images, but will do so in the future.
