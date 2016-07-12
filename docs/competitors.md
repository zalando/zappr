# Comparison to other solutions

*Last update: 12th July, 2016*

There are other solutions similar to Zappr available. Here is a comparison to them:

## LGTM

[LGTM](https://lgtm.co/docs/overview/) works in a very similar fashion as Zappr does. There are couple of things to note:

* LGTM requires you to maintain a MAINTAINERS file to identify valid approvers. This is good practice anyways, but with Zappr you can reference entire Github organizations, collaborators of the project or single users.
* LGTM gives you approvals for PRs. Zappr gives you that and also vetos, different approver groups, commit message checks, automatic branch creation, heuristics for specifications and more to come.
* LGTM *"will require a [modest licensing fee for on-premise enterprise use](https://lgtm.co/docs/install/) in the near future"*. Zappr Enterprise you are allowed to just run without paying us.
* LGTM has some [CLI tools](https://lgtm.co/docs/commands/). So [do](https://github.com/zalando/github-maintainer-cli) [we](https://github.com/zalando-incubator/oakkeeper).
* LGTM has a status page. [We don't](https://github.com/zalando/zappr/issues/357). 😕

## PullApprove

[PullApprove](https://pullapprove.com) works also technically the same like Zappr. Noteworthy:

* PullApprove supports private repositores, currently we do not. We will support them in the future.
* Some of PullApprove's features [cost money](https://pullapprove.com/pricing/), Zappr is 100 % free as in beer and freedom.
* PullApprove has a custom web UI you can use to give approvals. Zappr strives to offer only the minimal necessary web UI as you should do your work on GitHub to avoid friction in your workflow.
* As of now every customization available in PullApprove is also available in Zappr.

## ReviewNinja

[ReviewNinja](https://www.review.ninja/) is another GitHub integration that focuses on pull request reviews. Differences to Zappr are:

* ReviewNinja gives you a web UI that you are supposed to use for the most part. Interactions on GitHub are supported too. We think you should do your work only on GitHub as much as possible. If we could drop the Zappr web UI, we would.
* ReviewNinja gives you more detailed reviews, i.e. you can mark specific code sections to be fixed. On Zappr you can only give approvals or vetos.
* On Zappr you are supposed to review every file in a pull request, there is no equivalent to `.ninjaignore`.
* ReviewNinja works with private repositories, Zappr currently doesn't.
