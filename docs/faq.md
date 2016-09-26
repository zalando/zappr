# Frequently Asked Questions

## Why do you need these scopes?

Currently we ask you to give us authorization to do three things:

### Read your email address

The email address we need to inform you in case of an emergency, if it ever happens.

### Read and write access to your repositories

We need read access to your repository because otherwise you cannot provide us with custom configuration options (this is done by a `.zappr.yaml` file in your repository).

The write access is necessary to

* set commit statuses on your pull requests
* being able to verify if a user is a contributor to your repository,
* automatically create branches.

Aside from that GitHub currently does not support read-only access to repositories.

### Admin access for web hooks

Web hooks are Github's way to inform us about events in your repository, e.g. somebody commented on an issue. We depend on such web hooks to get *any* information about what happens, we cannot work without. So when you enable Zappr in your repository, we add/update a web hook. Reversely, when you disable all Zappr features we delete our installed web hook again. The latter is what the admin access is for.

## What about native GitHub approvals?

GitHub also has [native approvals](https://github.com/blog/2256-a-whole-new-github-universe-announcing-new-tools-forums-and-features). Zappr was built before this feature existed. We don’t exactly know yet how the relationship between Zappr and GitHub approvals will be. First of all we will wait for support in the GitHub API and web hooks. Then we can decide if we either drop Zappr approvals, integrate GitHub approvals or keep Zappr approvals.
