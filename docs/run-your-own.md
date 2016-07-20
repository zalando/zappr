# Run your own Zappr

So you what to run your own Zappr because you too have Github Enterprise or... just don't want to use [Zappr Opensource](https://zappr.opensource.zalan.do). That's fine. Here's what you need:

* A Github. This might be a Github Enterprise instance or you can use the public Github.
* A Postgres database. You can use SQLite out of the box too, but we don't recommend it for production. 🙃
* If you want to run Zappr on multiple nodes, you will need some kind of load balancer.
* For encrypting tokens stored in the database we use KMS.
