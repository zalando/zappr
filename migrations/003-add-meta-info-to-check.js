const schema = 'zappr_data'

module.exports.up = function up(queryInterface, Sequelize) {
  return Promise.all([
    queryInterface.addColumn(
      {
        tableName: 'users',
        schema
      },
      'access_level',
      {
        type: Sequelize.ENUM(['minimal', 'extended']),
        allowNull: false,
        defaultValue: 'minimal'
      }),
    queryInterface.addColumn(
      {
        tableName: 'checks',
        schema
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
    query.removeColumn(
      {
        tableName: 'users',
        schema
      },
      'access_level'),

    query.removeColumn(
      {
        tableName: 'checks',
        schema
      },
      'created_by')
  ])
}
