const schema = 'zappr_data'
const tableName = 'checks'

module.exports.up = function (queryInterface, Sequelize) {
  // delay between github and check execution
  const lastExecutionDelayMs = queryInterface.addColumn(
    {
      schema,
      tableName
    },
    'last_execution_delay_ms',
    {
      type: Sequelize.INTEGER,
      allowNull: true
    })
  // when check was executed
  const lastExecution = queryInterface.addColumn(
    {
      schema,
      tableName
    },
    'last_execution_ts',
    {
      type: Sequelize.DATE,
      allowNull: true
    })
  // how long did check execution take
  const lastExecutionMs = queryInterface.addColumn(
    {
      schema,
      tableName
    },
    'last_execution_ms',
    {
      type: Sequelize.INTEGER,
      allowNull: true
    })
  // was check execution successful (ie we were able to set a status)
  const lastExecutionSuccessful = queryInterface.addColumn(
    {
      schema,
      tableName
    },
    'last_execution_successful',
    {
      type: Sequelize.BOOLEAN,
      allowNull: true
    })
  return Promise.all([
    lastExecutionDelayMs,
    lastExecution,
    lastExecutionMs,
    lastExecutionSuccessful
  ])
}

module.exports.down = function (queryInterface) {
  return Promise.all(
    ['last_execution_successful',
      'last_execution_ms',
      'last_execution_ts',
      'last_execution_delay_ms'].map(col => queryInterface.removeColumn({
      tableName,
      schema
    }, col)))

}
