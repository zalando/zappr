import { Schema, arrayOf } from 'normalizr'

// https://github.com/gaearon/normalizr

const user = new Schema('users', {idAttribute: (user => user.json.login)})
const userJson = new Schema('users', {idAttribute: 'login'})

const repo = new Schema('repos', {idAttribute: (repo => repo.json.full_name)})
const repoJson = new Schema('repos', {idAttribute: 'full_name'})

const verification = new Schema('verification', {idAttrbute: 'repoId'})

const check = new Schema('checks', {idAttribute: (check => checkId(check.repositoryId, check.type))})

/**
 * @param {number} repositoryId - Id of the repository
 * @param {string} checkType - Type of the check
 * @returns {string}
 */
export function checkId(repositoryId, checkType) {
  return `${repositoryId}/${checkType}`
}

user.define({
  json: userJson
})

repoJson.define({
  owner: userJson
})

repo.define({
  json: repoJson,         // Github data
  checks: arrayOf(check), // Zappr attribute
  users: arrayOf(user),   // Zappr attribute
  verification
})

export const REPOS_SCHEMA = arrayOf(repo)
