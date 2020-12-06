const dbconfig = require('./config.json')
const { Client } = require('pg')

if (dbconfig.databaseUser && dbconfig.databaseAddress && dbconfig.databaseName && dbconfig.databasePassword) {
  const db = new Client({
    user: dbconfig.databaseUser,
    host: dbconfig.databaseAddress,
    database: dbconfig.databaseName,
    password: dbconfig.databasePassword,
    port: 5432
  })
  module.exports = db
}
