const dbconfig = require('./config.json')
const { Client } = require('pg')
let dbuser = getDbUser()
let host = getHost()
let database = getDatabase()

function getDbUser() {
	let dbuser = 'postgres'
	if (dbconfig.databaseUser) {
		dbuser = dbconfig.databaseUser
	}
	return dbuser
}

function getHost() {
	let host = 'localhost'
	if (dbconfig.databaseAddress) {
		host = dbconfig.databaseAddress
	}
	return host
}

function getDatabase() {
	let database = 'postgres'
	if (dbconfig.databaseName) {
		database = dbconfig.databaseName
	}
	return database
}

const db = new Client({
	user: dbuser,
	host: host,
	database: database,
	password: dbconfig.databasePassword,
	port: 5432,
})

module.exports = db