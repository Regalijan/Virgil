const config = require('../config.json')
const db = require('../database')
const mailer = require('../mailer')

module.exports = {
  name: 'accept',
  description: 'Accepts a user\'s appeal',
  guildOnly: true,
  async execute (message, args) {
    if (message.member.roles.cache.some(role => config.appealsManagerRole.includes(role.id))) {
      const userval = args[0]
      const appeal = await db.query('SELECT * FROM appeals WHERE discord_id = $1;', [userval]).catch(e => { 
        console.error(e)
        return message.channel.send('There was an error looking up this user!')
      })
      if (appeal.rowCount === 0) return message.channel.send('I could not find this user in the database.')
      await mailer.execute('Appeal Accepted',`<html>Your appeal was accepted, you may join us again at our <a href="${config.appealsInvite}" target="_blank">discord server</a>.<br/><br/>Note from the moderation team: ${args.note}</html>`,appeal.rows[0].email).catch(e => {
        console.error(e)
        return message.channel.send('The email could not be sent! Check the console for details.')
      })
      await db.query('DELETE FROM appeals WHERE discord_id = $1;', [userval]).catch(e => {
        console.error(e)
        return message.channel.send('I could not finish closing this appeal! The user was most likely emailed but the appeal may still appear in the database.')
      })
      message.channel.send('Appeal closed and user emailed!')
    }
  }
}
