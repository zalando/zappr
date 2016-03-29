# DB Migrations

Name your file like `001-what-does-it-do.js`. It should have a content like this:

~~~ javascript
module.exports.up = function up(query, Sequelize) {
    return query.addColumn({tableName: 'repositories', schema: 'zappr_data'}, 'hookSecret', Sequelize.STRING)
}

module.exports.down = function down(query) {
    return query.removeColumn({tableName: 'repositories', schema: 'zappr_data'}, 'hookSecret')
}
~~~

The server will automatically execute them on startup.
