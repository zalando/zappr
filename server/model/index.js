import User from './User'
import Repository from './Repository'
import Check from './Check'
import PullRequest from './PullRequest'
import { UserRepository } from './relations'

// Relations, see http://docs.sequelizejs.com/en/latest/docs/associations
// User <(n)---(m)> Repository
User.belongsToMany(Repository, {through: {model: UserRepository, unique: true}})
Repository.belongsToMany(User, {through: {model: UserRepository, unique: true}})
// Repository <(1)---(m)> Check
Repository.hasMany(Check, {foreignKey: {allowNull: false}})
Check.belongsTo(Repository, {foreignKey: {allowNull: false}})
// Repository <(1)---(m)> PullRequest
Repository.hasMany(PullRequest, {foreignKey: {allowNull: false}})
PullRequest.belongsTo(Repository, {foreignKey: {allowNull: false}})

export { db } from './Database'
export { default as User } from './User'
export { default as Repository } from './Repository'
export { default as Check } from './Check'
export { default as PullRequest } from './PullRequest'
export { default as Session } from './Session'
export { UserRepository } from './relations'
