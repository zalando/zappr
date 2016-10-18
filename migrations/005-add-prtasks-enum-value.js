module.exports.up = function up(queryInterface) {
  if (queryInterface.sequelize.options.dialect === 'postgres') {
    // alter enum type
    return queryInterface.sequelize.query(`ALTER TYPE zappr_data.enum_checks_type ADD VALUE IF NOT EXISTS 'pullrequesttasks';`)
  }
  // for sqlite we do not care as it is used for development
  return Promise.resolve()
}

module.exports.down = function down() {
  // there is no good downgrade
  return Promise.resolve()
}
