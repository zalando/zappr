module.exports.up = function up(query, Sequelize) {
    return query.addColumn({tableName: 'repositories', schema: 'zappr_data'}, 'hookSecret', Sequelize.STRING)
}

module.exports.down = function down(query) {
    return query.removeColumn({tableName: 'repositories', schema: 'zappr_data'}, 'hookSecret')
}
