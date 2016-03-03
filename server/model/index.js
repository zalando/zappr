import User from './User'
import Repository from './Repository'
import Check from './Check'
import PullRequest from './PullRequest'

// Relations, see http://docs.sequelizejs.com/en/latest/docs/associations
User.hasMany(Repository, {foreignKey: {allowNull: false}})
Repository.belongsTo(User, {foreignKey: {allowNull: false}})
Repository.hasMany(Check, {foreignKey: {allowNull: false}})
Repository.hasMany(PullRequest, {foreignKey: {allowNull: false}})
Check.belongsTo(Repository, {foreignKey: {allowNull: false}})

export { db } from './Database'
export { default as User } from './User'
export { default as Repository } from './Repository'
export { default as Check } from './Check'
export { default as PullRequest } from './PullRequest'
export { default as Session } from './Session'
