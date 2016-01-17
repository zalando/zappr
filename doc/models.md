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
* hasMany [Statuses](#status)

## Check

Zappr [check](checks.md).

|name          |type   |
|--------------|-------|
|id            |BIGINT |
|type          |ENUM   |
|arguments     |JSONB  |

* belongsTo [Repository](#repository)

## Webhook

Github web hook.

|name          |type   |
|--------------|-------|
|id            |BIGINT |
|json          |JSONB  |

* belongsTo [Repository](#repository)

## Status

Github status.

|name          |type   |
|--------------|-------|
|id            |BIGINT |
|ref           |STRING |
|json          |JSONB  |

* belongsTo [Repository](#repository)
