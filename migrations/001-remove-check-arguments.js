const schema = 'zappr_data'

module.exports.up = function up(queryInterface) {
  return queryInterface.removeColumn({
      tableName: 'checks',
      schema
    },
    'arguments')
}

module.exports.down = function down(queryInterface) {
  return queryInterface.addColumn({
      tableName: 'checks',
      schema
    },
    'arguments',
    {
      type: Sequelize.JSONB,
      allowNull: false
    })
}
