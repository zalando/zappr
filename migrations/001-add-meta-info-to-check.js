var Modes = require('../common/ZapprModes')

module.exports.up = function up(query, Sequelize) {
  return Promise.all([
                  query.addColumn({
                      tableName: 'users',
                      schema: 'zappr_data'
                    },
                    'zappr_mode',
                    {
                      type: Sequelize.ENUM(...Modes.MODES),
                      allowNull: false,
                      defaultValue: Modes.MINIMAL
                    }),
                  query.addColumn({
                      tableName: 'checks',
                      schema: 'zappr_data'
                    },
                    'created_by',
                    {
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
                  query.removeColumn({
                      tableName: 'users',
                      schema: 'zappr_data'
                    },
                    'zappr_mode'),
                  query.removeColumn({
                      tableName: 'checks',
                      schema: 'zappr_data'
                    },
                    'created_by')
                ])
                .catch(console.log.bind(console))
}
