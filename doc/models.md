# Models

## repository

Github repository.

|name          |type   |
|--------------|-------|
|id            |BIGINT |
|json          |JSONB  |

has (0..*) [checks](#check)
has (0..*) [webhooks](#webhook)

## check

zappr check.

|name          |type   |
|--------------|-------|
|id            |BIGINT |
|repository_id |BIGINT |
|type          |STRING |

belongs-to (1) [repository](#repository)
has (0..*) [statuses](#status)

## webhook

Github web hook.

|name          |type   |
|--------------|-------|
|id            |BIGINT |
|repository_id |BIGINT |
|json          |JSONB  |

belongs-to (1) [repository](#repository)

## status

Github status.

|name          |type   |
|--------------|-------|
|id            |BIGINT |
|check_id      |BIGINT |
|json          |JSONB  |

belongs-to (1) [check](#check)
