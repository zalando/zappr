module.exports.up = function up(queryInterface) {
  return queryInterface.sequelize.query(`ALTER TYPE zappr_data.enum_checks_type ADD VALUE IF NOT EXISTS 'pullrequestlabels';`)
}
module.exports.down = function down() {
  // there is no good downgrade
  return Promise.resolve()
}
