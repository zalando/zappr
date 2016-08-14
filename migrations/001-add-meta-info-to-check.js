module.exports.up = function up(query, Sequelize) {
  return Promise.all([
                  query.addColumn('users', 'zappr_mode', {
                    type: Sequelize.TEXT,
                    allowNull: false,
                    defaultValue: 'default'
                  }),
                  query.addColumn('checks', 'created_by', {
                    type: Sequelize.TEXT,
                    allowNull: true
                  })
                ])
                // this throws errors if the columns are already in place
                // so we catch and log them
                // sucks, but otherwise this would have to be a raw query supporting both dialects
                .catch(console.log.bind(console))
}

module.exports.down = function down(query) {
  return Promise.all([
                  query.removeColumn('users', 'zappr_mode'),
                  query.removeColumn('checks', 'created_by')
                ])
                .catch(console.log.bind(console))
}
