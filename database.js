const dbconfig = require('./config.json')
const { Client } = require('pg')
const dbuser = getDbUser()
const host = getHost()
const database = getDatabase()

function getDbUser () {
  if (dbconfig.databaseUser) {
    return dbconfig.databaseUser
  }
  return 'postgres'
}

function getHost () {
  if (dbconfig.databaseAddress) {
    return dbconfig.databaseAddress
  }
  return 'localhost'
}

function getDatabase () {
  if (dbconfig.databaseName) {
    return dbconfig.databaseName
  }
  return 'postgres'
}

const db = new Client({
  user: dbuser,
  host: host,
  database: database,
  password: dbconfig.databasePassword,
  port: 5432
})

module.exports = db
