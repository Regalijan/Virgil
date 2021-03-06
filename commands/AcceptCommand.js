module.exports = {
  name: 'accept',
  properName: 'Accept',
  description: 'Accepts a user\'s appeal',
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
      const appealsinvite = await db.query('SELECT appeals_invite FROM core_settings WHERE guild_id = $1;', [message.guild.id])
      let body = '<html>Your appeal was accepted, you may join us again at our '
      if (appealsinvite.rowCount > 0) body += `<a href="${appealsinvite.rows[0].appeals_invite}" target="_blank">discord server</a>`
      else body += 'discord server'
      body += `.<br/><br/>Note from the moderation team: ${note}</html>`
      await mailer.execute('Appeal Accepted', body, user.rows[0].email)
    } catch (e) {
      console.error(e)
      return message.channel.send('The email could not be sent! Check the console for details.')
    }
    await db.query('DELETE FROM appeals WHERE discord_id = $1;', [userval]).catch(e => {
      console.error(e)
      return message.channel.send('I could not finish closing this appeal! The user was most likely emailed but the appeal may still appear in the database.')
    })
    if (!message.guild.me.hasPermission('BAN_MEMBERS')) return message.channel.send('The appeal was accepted but I could not unban them as I do not have permission.')
    await message.guild.members.unban(userval).catch(e => {
      console.error(e)
      return message.channel.send('The appeal was accepted, but I was unable to unban them due to an unknown error.')
    })
    await message.channel.send('Appeal closed and user emailed!')
  }
}
