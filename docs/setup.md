# Set up Zappr

Using your GitHub account, sign in to Zappr [here](https://zappr.opensource.zalan.do/login).

![Login](img/setup/login.png)

Authorize Zappr. We outline why we need certain scopes in our [FAQ](https://zappr.readthedocs.org/en/latest/faq).

Once you're back at Zappr you will see all repositories that we know listed on the left. Initially we only fetch the first couple of repositories, so if you don't find the one you're looking for please click the blue "Sync with Github" button. It will then load all the repositories, which might take a couple of seconds. Also use this button if you want to enable Zappr for repositories that are new in your account.

![IMAGE](img/setup/repo-list.png)

To enable Zappr features on a specific repository, select a it from the list and switch the toggle to "On".

![IMAGE](img/setup/repo.png)

See below how to customize Zappr to your needs.

## Zappr features and their configuration options

You can customize Zappr by adding a [`.zappr.yaml`](https://github.com/zalando/zappr/blob/master/.zappr-example.yaml) file to your repository (top-level), similar to Travis. It [takes](https://github.com/zalando/zappr/blob/master/.zappr-example.yaml) a couple of different options. We keep an [example configuration file](https://github.com/zalando/zappr/blob/master/.zappr-example.yaml) in our repository.

### Approvals

The approval feature blocks a pull request (if you enabled [protected branches](https://github.com/blog/2051-protected-branches-and-required-status-checks)) until it has the required amount of approvals (essentially people confirming that the changes are good to merge).

It is customized by everything under `approvals`. The following options are supported:

* `minimum`: How many approvals a pull request needs before it is considered mergable. Defaults to 2.
* `ignore`: Whether Zappr should ignore approvals by the `last_committer` on the pull request, the `pr_opener`, `both` or `none`. Defaults to `none`.
* `pattern`: Since approvals are essentially comments that match a pattern, you can configure the pattern! It's a string that will be passed to Javascript's `RegExp` constructor and defaults to `^(:+1:|👍)$`. (Tip: If you're not sure about your regex, [regex101.com](https://regex101.com/) is great to test it.)
* `from`: By default any comment that matches the pattern is considered an approval, regardless of the author. You can change this by
 * `organization`: list organizations under `orgs` that the author has to be a public member of
 * `usernames`: list usernames under `users`
 * `collaborators`: set the `collaborators` flag to `true`
* `groups`: If there are sets of people you absolutely want to approve every pull request in your project, you can define groups and set a `minimum` amount of approvals required by its members. Use a `from` clause (see above) to specify who's a member and who isn't.

~~~ yaml
# just an example how to configure it
approvals:
  pattern: "^(:\\+1:|👍)" # must start with thumbs up
  minimum: 2 # at least two approvals from other people necessary
  ignore: pr_opener # do not count approval from PR opener
  from: # has to be either one of the following
    orgs:
      - zalando
    collaborators: true
    users:
      - prayerslayer
      - mfellner
  groups:
    # mfellner is required approver on every PR
    seniors:
      minimum: 1
      from:
        users:
          - mfellner
~~~

Since approvals from `group` members are counted against the total amount of approvals as well you can omit the `from` clause if you only have groups.

~~~ yaml
approvals:
  # check will succeed if there are 4 approvals from
  # backend or frontend people
  minimum: 4
  groups:
    # check will fail if there is not at least 1 approval
    # from backend persons
    backend:
      minimum: 1
      from:
        users:
          - backendperson1
          - backendperson2
          - backendperson3
    # check will fail if there is not at least 1 approval
    # from frontend persons
    frontend:
      minimum: 1
      from:
        users:
          - frontendperson1
          - frontendperson2
          - frontendperson3
~~~

### Autobranch

The automatic branch creation feature creates a branch in you repository for every ticket that is opened, so you don't have to.

It is customized by putting configuration under `autobranch`. The following options are supported:

* `pattern`: How the branch name is generated. It is a template string where you can use the variables `{number}`, `{title}` and `{labels}`. Defaults to `{number}-{title}`.
* `length`: Maximum length of the branch name, will be cut off. Defaults to 60 characters.

~~~ yaml
# example configuration
autobranch:
  pattern: {number}-{title}
  length: 60
~~~

### Commit Messages

The commit message feature lets you verify that all commit messages in a pull request match a pattern. The primary use case for this is to have all commits mention the ticket number.

It is configured by putting configuration under `commit.message` and supports the following options:

* `patterns`: Which regexes to check the commit messages against. Always also matches `^#[0-9]+` (default). Matching is done by logical OR concatenation, ie. messages have to match any one of the provided patterns.

~~~ yaml
# example configuration
commit:
  message:
    patterns: # commit message has to match any one of
      - "^#[0-9]+" # starts with hash and digits
      - "^[A-Z]+-[0-9]+" # starts with uppercase letters, a dash and digits
~~~

### Specification

The specification check lets you verify that proper specification was provided along with a pull request. This is based on heuristics you define.

It is configured by putting your config under `specification` and supports the following options:

~~~ yaml
specification:
  # title requirements AND body AND template requirements have to match
  title:
    # PR title is at least this many characters long
    minimum-length:
      enabled: true
      length: 8
  body:
    # either of these verifications has to be true
    # PR body is at least this many characters long
    minimum-length:
      enabled: true
      length: 8
    # contains a link
    contains-url: true
    # contains an issue number
    contains-issue-number: true
   template:
     # is different from pull request body
     differs-from-body: true
~~~

### Ticket linking

With enabled ticket linking ZAPPR will add a section with links to all tickets which are metioned in the commits of a pull request.
The ticket ID's are recognized by a configurable pattern and the url will be generated using the configured base url.

The result could look like this (example for github and jira)
```
Initial pr body content
 
#### Tickets:
http://github.com/owner/repository/23
http://jira.domain.com/issue/PROJ-23
```

Possible options are:
- `url` The URL is the url to a ticket without it's ID. It accepts the placeholders
  - `owner` The name of the repository owner
  - `repo` The name of the repository itself
  - `id` The parsed ticket identifier
- `pattern` This pattern is a javascript valid regular expression which matches either the first group or if no group is available the whole string.
  - Example pattern for Github issues `"^#([0-9]+)"`
  - Example pattern for JIRA tickets `"^[A-Z][A-Z0-9_]+[0-9]+"`
- `headline` The headline above the link enumeration in the pr body.

Here you can find the default configuration
```
linkticket:
	url: "https://github.com/${owner}/${repo}/issues/${id}"
	pattern: "^#([0-9]+)"
	headline: "#### Tickets:"
```
