# API

## Client resources

Called by the Zappr client.

### Enable zappr for a repository

**POST /api/repos/:id/checks**

request:

```json
{
  "type": "approval"
}
```

response:

```json
{
  "id": 1,
  "type": "approval"
}
```

For the repository with the given ID:

1. [Create][1] or or [update][2] a webhook for the [events][4] `pull_request`, `pull_request_review_comment`
2. Create or update a [webhook](models.md#webhook) entity in the database
  - create a new entity if none exists for this repository
  - update an existing entity with the events required by this check
3. Create a new [check](models.md#check) entity in the database

### Disable zappr for a repository

**DELETE /api/repos/:id/checks/:check_id**

For the repository with the given ID:

1. [Delete][3] or [update][2] the associated webhook
2. Delete or update the corresponding [webhook](models.md#webhook) entity in the database
3. Delete the corresponding [check](models.md#check) entity in the database
4. Delete all corresponding [status](models.md#status) entities in the database

## Webhook endpoints

Called by the Github service.

### pull_request

**POST /api/webhooks/pull_request**

* [opened](events.md#opened)
* [closed](events.md#closed)

### pull_request_review_comment

**POST /api/webhooks/pull_request_review_comment**

* [created](events.md#created)

[1]: https://developer.github.com/v3/repos/hooks/#create-a-hook
[2]: https://developer.github.com/v3/repos/hooks/#edit-a-hook
[3]: https://developer.github.com/v3/repos/hooks/#delete-a-hook
[4]: https://developer.github.com/webhooks/#events
