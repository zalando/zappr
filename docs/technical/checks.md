# Checks

## Approval

#### applied to

* [PullRequestReviewCommentEvent](events.md#pullrequestreviewcommentevent)

#### arguments

* required (`Number`)
* reviewers (`Array.<Object>`)
    * username (`String`)
    * required (`Boolean`)
* keywords (`Array.<Object>`)
    * value (`String`)
    * type (`String`) - `[approve, disapprove]`

#### returns

* 1 if positive approval
* -1 if negative approval (disapproval)
* 0 if no action
