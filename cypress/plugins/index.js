/// <reference types="cypress" />
// ***********************************************************
// This example plugins/index.js can be used to load plugins
//
// You can change the location of this file or turn off loading
// the plugins file with the 'pluginsFile' configuration option.
//
// You can read more here:
// https://on.cypress.io/plugins-guide
// ***********************************************************

// This function is called when a project is opened or re-opened (e.g. due to
// the project's config changing)

const { Pool } = require('pg')
const childProcess = require('child_process')
const { promisify } = require('util')

const exec = promisify(childProcess.exec)

const pool = new Pool({
  user: 'app_dv_myra',
  password: 'banana',
  database: 'myra',
  port: 5433
})

module.exports = (on, config) => {
  require('cypress-log-to-output').install(on)

  on('task', {
    query({ sql, values = [] }) {
      return pool.query(sql, values)
    },
    async resetDb() {
      // Reset data in database
      await pool.query(`
        do
        $$
        declare
          l_stmt text;
        begin
          select 'truncate ' || string_agg(format('%I.%I', schemaname, tablename), ',')
            into l_stmt
          from pg_tables
          where schemaname in ('public');

          execute l_stmt;
        end;
        $$
      `)

      // Re-seed database
      return exec(
        `cd .tmp/range-api && \\
        POSTGRESQL_DATABASE=myra POSTGRESQL_HOST=localhost POSTGRESQL_PORT=5433 npx knex seed:run && \\
        POSTGRESQL_DATABASE=myra POSTGRESQL_HOST=localhost POSTGRESQL_PORT=5433 npx babel-node scripts/import.js true`
      )
    },
    async setupStaffUser(username) {
      await pool.query(
        `
      INSERT INTO user_account(given_name, family_name, username, email, pia_seen)
        VALUES (
          'Range',
          'Officer',
          $1,
          $1,
          true
        )`,
        [username]
      )

      return pool.query(
        `
        UPDATE ref_zone
        SET user_id = user_account.id
        FROM user_account
        WHERE user_account.username = $1
        AND ref_zone.id = 55
      `,
        [username]
      )
    }
  }),
    // modify config values
    (config.defaultCommandTimeout = 10000)

  // modify env var value
  config.env.ENVIRONMENT = 'dev'

  // return config
  return config
}
