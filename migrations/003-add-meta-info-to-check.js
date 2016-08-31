const schema = 'zappr_data'
const checksTable = 'checks'
const usersTable = 'users'
const accessLevelColumn = 'access_level'
const createdByColumn = 'created_by'

module.exports.up = function up(queryInterface, Sequelize) {
  return Promise.all([
    queryInterface.addColumn(
      usersTable,
      accessLevelColumn,
      {
        type: Sequelize.ENUM(['minimal', 'extended']),
        allowNull: false,
        defaultValue: 'minimal'
      },
      {schema}),
    queryInterface.addColumn(
      checksTable,
      createdByColumn,
      {
        type: Sequelize.TEXT,
        allowNull: true
      },
      {schema})
  ])
}

module.exports.down = function down(query) {
  return Promise.all([
    query.removeColumn(
      usersTable,
      accessLevelColumn,
      {schema}),

    query.removeColumn(
      checksTable,
      createdByColumn,
      {schema})
  ])
}
