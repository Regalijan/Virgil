module.exports = {
  name: 'deny',
  properName: 'Deny',
  description: 'Denies a user\'s appeal',
  guildOnly: true,
  async execute (message, args) {
    const db = require('../database')
    const mailer = require('../mailer')
    const useroverridecheck = await db.query('SELECT * FROM appeals_managers WHERE type = \'user\' AND guild = $1 AND id = $2;', [message.guild.id, message.author.id])
    const roleoverridecheck = await db.query('SELECT * FROM appeals_managers WHERE guild = $1 AND type = \'role\';', [message.guild.id])
    const overrides = []
    roleoverridecheck.rows.forEach(row => overrides.push(row.id.toString()))
    if (useroverridecheck.rowCount === 0 && !message.member.roles.cache.some(role => overrides.includes(role.id)) && !message.member.hasPermission('ADMINISTRATOR')) return
    const userval = args[0]
    let note = 'No note provided.'
    if (args[1]) note = args.slice(1).join(' ')
    const usercheck = await db.query('SELECT * FROM appeals WHERE discord_id = $1;', [userval]).catch(e => {
      console.error(e)
      return message.channel.send('There was an error looking up this user!')
    })
    if (usercheck.rowCount === 0) return message.channel.send('I could not find this user in the database.')
    const user = await db.query('SELECT * FROM auth WHERE discord_id = $1;', [userval]).catch(e => {
      console.error(e)
      return message.channel.send('There was an error looking up this user!')
    })
    try {
      let { appealDeniedBody, bodiesAreFiles } = require('../config.json')
      if (bodiesAreFiles) {
        const { readFileSync } = require('fs')
        try {
          appealDeniedBody = readFileSync(appealDeniedBody, { encoding: 'utf-8' })
        } catch (e) {
          console.error(e)
          return message.channel.send('An error occured while reading the body!')
        }
        if (!appealDeniedBody) return
      }
      appealDeniedBody.replace(/%NOTE%/, note)
      await mailer.execute('Appeal Denied', appealDeniedBody, user.rows[0].email)
    } catch (e) {
      console.error(e)
      return message.channel.send('The email could not be sent! Check the console for details.')
    }
    await db.query('DELETE FROM appeals WHERE discord_id = $1;', [userval]).catch(e => {
      console.error(e)
      return message.channel.send('I could not finish closing this appeal! The user was most likely emailed but the appeal may still appear in the database.')
    })
    message.channel.send('Appeal closed and user emailed!')
  }
}
