const schema = 'zappr_data'
const tableName = 'repositories'
const columnName = 'welcomed'

module.exports.up = function (queryInterface, Sequelize) {
  return queryInterface.addColumn(
    {
      tableName,
      schema
    },
    columnName,
    {
      type: Sequelize.BOOLEAN,
      allowNull: false,
      defaultValue: false
    })
}

module.exports.down = function (queryInterface) {
  return queryInterface.removeColumn({tableName, schema}, columnName)
}
