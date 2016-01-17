# Events

## [PullRequest][1] 

### opened

1. Create a new 'pending' [status][2]
2. Create a new 'status' [entity](models.md#status) in the database

### closed

do nothing (?)

## [PullRequestReviewCommentEvent][3]

### created

1. Apply [Approval](checks.md#approval) check
2. Submit a new [status][2] to the Github API
  * Create a new status
    - `success` if all positive check requirements are met (approval)
    - `failure` if all negative check requirements are met (disapproval)
  * Update the `pending` status (optional)

[1]: https://developer.github.com/v3/activity/events/types/#pullrequestevent
[2]: https://developer.github.com/v3/repos/statuses/#create-a-status
[3]: https://developer.github.com/v3/activity/events/types/#pullrequestreviewcommentevent
[4]: https://developer.github.com/v3/repos/hooks/#delete-a-hook
