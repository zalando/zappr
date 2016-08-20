const tableName = 'repositories'
const schema = 'zappr_data'
const columnName = 'welcomed'

module.exports.up = function (queryInterface, Sequelize) {
  const dialect = queryInterface.sequelize.options.dialect
  const table = dialect === 'postgres' ? {tableName, schema} : tableName
  return queryInterface.addColumn(
    table,
    columnName,
    {
      type: Sequelize.BOOLEAN,
      allowNull: false,
      defaultValue: false
    })
}

module.exports.down = function (queryInterface) {
  const dialect = queryInterface.sequelize.options.dialect
  const table = dialect === 'postgres' ? {tableName, schema} : tableName
  return queryInterface.removeColumn(table, columnName)
}
