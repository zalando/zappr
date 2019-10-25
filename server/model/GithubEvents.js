/**
 * https://developer.github.com/webhooks/#events
 */

export const PING = 'ping'
/**
 * Any time a Commit is commented on.
 */
export const COMMIT_COMMENT = 'commit_comment'
/**
 * Any time a Commit is commented on. TODO: Mistake, copied from above?
 */
export const CREATE = 'create'
/**
 * Any time a Branch or Tag is deleted.
 */
export const DELETE = 'delete'
/**
 * Any time a Repository has a new deployment created from the API.
 */
export const DEPLOYMENT = 'deployment'
/**
 * Any time a deployment for a Repository has a status update from the API.
 */
export const DEPLOYMENT_STATUS = 'deployment_status'
/**
 * Any time a Repository is forked.
 */
export const FORK = 'fork'
/**
 * Any time a Wiki page is updated.
 */
export const GOLLUM = 'gollum'
/**
 * Any time an Issue or Pull Request is commented on.
 */
export const ISSUE_COMMENT = 'issue_comment'
/**
 * Any time an Issue is assigned, unassigned, labeled, unlabeled, opened, closed, or reopened.
 */
export const ISSUES = 'issues'
/**
 * Any time a User is added as a collaborator to a non-Organization Repository.
 */
export const MEMBER = 'member'
/**
 * Any time a User is added or removed from a team. Organization hooks only.
 */
export const MEMBERSHIP = 'membership'
/**
 * Any time a Pages site is built or results in a failed build.
 */
export const PAGE_BUILD = 'page_build'
/**
 * Any time a Repository changes from private to public.
 */
export const PUBLIC = 'public'
/**
 * Triggered when a pull request review is submitted into a non-pending state, the body is edited,
 * or the review is dismissed.
 * https://developer.github.com/v3/activity/events/types/#pullrequestreviewevent
 */
export const PULL_REQUEST_REVIEW = 'pull_request_review'
/**
 * Any time a comment is created on a portion of the unified diff of a pull request (the Files Changed tab).
 */
export const PULL_REQUEST_REVIEW_COMMENT = 'pull_request_review_comment'
/**
 * Any time a Pull Request is assigned, unassigned, labeled, unlabeled, opened, edited, closed, reopened,
 * or synchronized (updated due to a new push in the branch that the pull request is tracking).
 */
export const PULL_REQUEST = 'pull_request'
/**
 * Any Git push to a Repository, including editing tags or branches.
 * Commits via API actions that update references are also counted. This is the default event.
 */
export const PUSH = 'push'
/**
 * Any time a Repository is created. Organization hooks only.
 */
export const REPOSITORY = 'repository'
/**
 * Any time a Release is published in a Repository.
 */
export const RELEASE = 'release'
/**
 * Any time a Repository has a status update from the API.
 */
export const STATUS = 'status'
/**
 * Any time a team is added or modified on a Repository.
 */
export const TEAM_ADD = 'team_add'
/**
 * Any time a User stars a Repository.
 */
export const WATCH = 'watch'
