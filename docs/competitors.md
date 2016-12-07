# Comparison to Other, Similar Solutions

*Last update: 15th August, 2016*

To help you decide if Zappr's the right tool for your use case, we've compared it to other, similar solutions:

## LGTM

[LGTM](https://lgtm.co/docs/overview/) works in a fashion very similar to Zappr. Some differences to note:
 
 * LGTM requires you to keep a MAINTAINERS file to identify valid approvers. This is good practice anyways, but with Zappr you can reference entire GitHub organizations, project collaborators, or even single users.
 * LGTM gives you approvals for PRs. Zappr gives you that, as well as veto power for different approver groups, commit message checks, automatic branch creation, and heuristics for specifications, with more to come.

## PullApprove

[PullApprove](https://pullapprove.com) works, from a technical perspective, very much like Zappr does. Noteworthy differences:

* As of now, every customization available in PullApprove is also available in Zappr.
* Some of PullApprove's features [cost money](https://pullapprove.com/pricing/). As stated above, Zappr is free.
* PullApprove has a custom web UI you can use to give approvals. Zappr strives to offer only the minimal necessary web UI. We believe you should do your work on GitHub to avoid friction in your workflow.

## ReviewNinja

[ReviewNinja](https://www.review.ninja/) is another GitHub integration that focuses on pull request reviews. Notable differences:

* ReviewNinja offers a web UI that supports GitHub interactions. Zappr is built to encourage you to do your work only on GitHub, or as much as possible. If we could drop the Zappr web UI, we would.
* ReviewNinja gives you more detailed reviews — i.e., you can mark specific code sections to be fixed. On Zappr, you can only give approvals or vetoes.
* On Zappr, you must review every file in a pull request; there is no equivalent to `.ninjaignore`.
