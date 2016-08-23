const schema = 'zappr_data'

module.exports.up = function up(queryInterface, Sequelize) {
  // session
  return Promise.all([
    queryInterface.createTable('sessions', {
      id: {
        type: Sequelize.STRING,
        primaryKey: true,
        unique: true,
        allowNull: false,
        autoIncrement: false
      },
      json: {
        type: Sequelize.JSONB,
        allowNull: false
      },
      createdAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.NOW()
      },
      updatedAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.NOW()
      }
    }, {
      schema
    }),
    // user
    queryInterface.createTable('users', {
      id: {
        type: Sequelize.BIGINT,
        primaryKey: true,
        unique: true,
        allowNull: false,
        autoIncrement: false
      },
      json: {
        type: Sequelize.JSONB,
        allowNull: false
      },
      createdAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.NOW()
      },
      updatedAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.NOW()
      }
    }, {schema}),
    // repository
    queryInterface.createTable('repositories', {
      id: {
        type: Sequelize.BIGINT,
        primaryKey: true,
        unique: true,
        allowNull: false,
        autoIncrement: false
      },
      json: {
        type: Sequelize.JSONB,
        allowNull: false
      },
      createdAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.NOW()
      },
      updatedAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.NOW()
      }
    }, {schema})
  ]).then(function () {
    return Promise.all([
      // user repositories
      queryInterface.createTable('user_repositories', {
        userId: {
          type: Sequelize.BIGINT,
          references: {
            model: {tableName: 'users', schema},
            key: 'id'
          },
          onDelete: 'cascade'
        },
        repositoryId: {
          type: Sequelize.BIGINT,
          references: {
            model: {tableName: 'repositories', schema},
            key: 'id'
          },
          onDelete: 'cascade'
        },
        createdAt: {
          type: Sequelize.DATE,
          allowNull: false,
          defaultValue: Sequelize.NOW()
        },
        updatedAt: {
          type: Sequelize.DATE,
          allowNull: false,
          defaultValue: Sequelize.NOW()
        }
      }, {schema}),
      // pull request
      queryInterface.createTable('pull_requests', {
        id: {
          type: Sequelize.BIGINT,
          primaryKey: true,
          unique: true,
          allowNull: false,
          autoIncrement: true
        },
        number: {
          type: Sequelize.INTEGER,
          allowNull: false
        },
        last_push: {
          type: Sequelize.DATE,
          allowNull: false,
          defaultValue: Sequelize.NOW
        },
        repositoryId: {
          type: Sequelize.BIGINT,
          references: {
            model: {tableName: 'repositories', schema},
            key: 'id'
          }
        },
        createdAt: {
          type: Sequelize.DATE,
          allowNull: false,
          defaultValue: Sequelize.NOW()
        },
        updatedAt: {
          type: Sequelize.DATE,
          allowNull: false,
          defaultValue: Sequelize.NOW()
        }
      }, {schema}),
      // check
      queryInterface.createTable('checks', {
        id: {
          type: Sequelize.BIGINT,
          primaryKey: true,
          unique: true,
          allowNull: false,
          autoIncrement: true
        },
        token: {
          type: Sequelize.TEXT,
          allowNull: false
        },
        arguments: {
          type: Sequelize.JSONB,
          allowNull: false
        },
        type: {
          type: Sequelize.ENUM([
            'approval',
            'autobranch',
            'specification',
            'commitmessage'
          ]),
          allowNull: false
        },
        repositoryId: {
          type: Sequelize.BIGINT,
          references: {
            model: {tableName: 'repositories', schema},
            key: 'id'
          }
        },
        createdAt: {
          type: Sequelize.DATE,
          allowNull: false,
          defaultValue: Sequelize.NOW()
        },
        updatedAt: {
          type: Sequelize.DATE,
          allowNull: false,
          defaultValue: Sequelize.NOW()
        }
      }, {schema}),
    ]).then(function () {
      // frozen comment
      return queryInterface.createTable('frozen_comments', {
        id: {
          type: Sequelize.BIGINT,
          primaryKey: true,
          unique: true,
          allowNull: false,
          autoIncrement: false
        },
        user: {
          type: Sequelize.TEXT,
          allowNull: false
        },
        created_at: {
          type: Sequelize.DATE,
          allowNull: false
        },
        body: {
          type: Sequelize.TEXT,
          allowNull: false
        },
        pullRequestId: {
          type: Sequelize.BIGINT,
          references: {
            model: {tableName: 'pull_requests', schema},
            key: 'id'
          }
        },
        createdAt: {
          type: Sequelize.DATE,
          allowNull: false,
          defaultValue: Sequelize.NOW()
        },
        updatedAt: {
          type: Sequelize.DATE,
          allowNull: false,
          defaultValue: Sequelize.NOW()
        }
      }, {schema})
    })
  })
}

module.exports.down = function down(queryInterface) {
  return queryInterface.dropAllTables({schema})
}
