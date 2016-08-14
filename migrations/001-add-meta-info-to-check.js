module.exports.up = function up(queryInterface, Sequelize) {
  console.log(queryInterface)
  const dialect = queryInterface.sequelize.options.dialect
  return Promise.all([
    /*
     * Using raw query because User.sync() does:
     *   - CREATE TYPE enum
     *   - CREATE TABLE IF NOT EXISTS
     * As migrations are run after sync(), the enum already exists.
     * The migration also wants to create it, so it fails.
     * Thus raw query referencing what should already be there.
     */
    queryInterface.sequelize.query(`
            ALTER TABLE zappr_data.users
            ADD COLUMN zappr_mode ${dialect === 'postgres' ? 'zappr_data.enum_users_zappr_mode' : 'TEXT'} NOT NULL DEFAULT 'minimal';`),
    queryInterface.addColumn({
        tableName: 'checks',
        schema: 'zappr_data'
      },
      'created_by',
      {
        type: Sequelize.TEXT,
        allowNull: true
      })
  ])
}

module.exports.down = function down(query) {
  return Promise.all([
    query.removeColumn({
        tableName: 'users',
        schema: 'zappr_data'
      },
      'zappr_mode'),
    query.removeColumn({
        tableName: 'checks',
        schema: 'zappr_data'
      },
      'created_by')
  ])
}
