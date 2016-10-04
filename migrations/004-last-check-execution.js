const schema = 'zappr_data'

module.exports.up = function up(queryInterface, Sequelize) {
  return Promise.all([
    queryInterface.addColumn(
      {
        tableName: 'checks',
        schema
      },
      'last_execution',
      {
        type: Sequelize.DATE,
        allowNull: true
      }),
    queryInterface.addColumn(
      {
        tableName: 'checks',
        schema
      },
      'last_execution_successful',
      {
        type: Sequelize.BOOLEAN,
        allowNull: true
      })
  ])
}

module.exports.down = function down(query) {
  return Promise.all([
    query.removeColumn(
      {
        tableName: 'checks',
        schema
      },
      'last_execution'),

    query.removeColumn(
      {
        tableName: 'checks',
        schema
      },
      'last_execution_successful')
  ])
}
