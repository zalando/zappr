import User from './User'
import Repository from './Repository'
import Check from './Check'

// Relations, see http://docs.sequelizejs.com/en/latest/docs/associations
User.hasMany(Repository, {foreignKey: {allowNull: false}})
Repository.belongsTo(User, {foreignKey: {allowNull: false}})
Repository.hasMany(Check, {foreignKey: {allowNull: false}})
Check.belongsTo(Repository, {foreignKey: {allowNull: false}})

export { db } from './Database.js'
export { default as User } from './User'
export { default as Repository } from './Repository'
export { default as Check } from './Check'
export { default as Session } from './Session'
