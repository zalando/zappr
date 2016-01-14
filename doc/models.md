# Models

## User

|name          |type   |
|--------------|-------|
|id            |BIGINT |
|json          |JSONB  |

* hasMany [Repositories](#repository)

## Repository

Github repository.

|name          |type   |
|--------------|-------|
|id            |BIGINT |
|json          |JSONB  |

* belongsTo [User](#user)
* hasMany [Checks](#check)
* hasMany [Webhooks](#webhook)

## Check

Zappr check.

|name          |type   |
|--------------|-------|
|id            |BIGINT |
|repository_id |BIGINT |
|type          |STRING |

* belongsTo [Repository](#repository)
* hasMany [Statuses](#status)

## Webhook

Github web hook.

|name          |type   |
|--------------|-------|
|id            |BIGINT |
|repository_id |BIGINT |
|json          |JSONB  |

* belongsTo [Repository](#repository)

## Status

Github status.

|name          |type   |
|--------------|-------|
|id            |BIGINT |
|check_id      |BIGINT |
|json          |JSONB  |

* belongsTo [Check](#check)
