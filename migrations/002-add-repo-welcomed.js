const schema = 'zappr_data'
const tableName = 'repositories'
const columnName = 'welcomed'

module.exports.up = function (queryInterface, Sequelize) {
  return queryInterface.addColumn(
    tableName,
    columnName,
    {
      type: Sequelize.BOOLEAN,
      allowNull: false,
      defaultValue: false
    },
    {schema})
}

module.exports.down = function (queryInterface) {
  return queryInterface.removeColumn(table, columnName, {schema})
}
