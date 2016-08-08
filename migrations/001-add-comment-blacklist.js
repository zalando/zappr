module.exports.up = function up(query, Sequelize) {
  return query.addColumn({tableName: 'repositories', schema: 'zappr_data'}, 'hookSecret', Sequelize.STRING)
}

module.exports.down = function down(query) {
  return query.removeColumn({tableName: 'repositories', schema: 'zappr_data'}, 'hookSecret')
}


module.exports.up = function up(query, Sequelize) {
  return query.addTable('blacklisted_comments', {
    id: {
      type: Sequelize.BIGINT,
      primaryKey: true,
      unique: true,
      allowNull: false,
      autoIncrement: false
    }
  })
}
