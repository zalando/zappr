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
