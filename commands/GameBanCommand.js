module.exports = {
  name: 'gameban',
  properName: 'GameBan',
  description: 'Bans user from game',
  guildOnly: true,
  async execute (message, args) {
    const db = require('../database')
    const usermodcheck = await db.query('SELECT * FROM gamemods WHERE id = $1 AND type = \'user\' AND guild = $2;', [message.author.id, message.guild.id])
    const modroles = await db.query('SELECT * FROM gamemods WHERE guild = $1 AND type = \'role\';', [message.guild.id])
    const roles = []
    modroles.rows.forEach(row => roles.push(row.id))
    if (usermodcheck.rowCount === 0 && !message.member.roles.cache.some(role => roles.includes(role.id))) return
    const modsettings = await db.query('SELECT * FROM gamemod_settings WHERE guild = $1;', [message.guild.id])
    if (modsettings.rowCount === 0) return
    const request = require('axios')
    const { Datastore } = require('@google-cloud/datastore')
    const banStore = new Datastore({ keyFilename: './servicekeys/banstore.json' })
    const reason = args.slice(1).join(' ')
    if ((args[0]) && (reason)) {
      const robloxData = await request(`https://api.roblox.com/users/get-by-username?username=${args[0]}`).catch(e => {
        console.error(e)
        return message.channel.send(`An error occured when looking up this user! ${e}`)
      })
      if (!robloxData.data.Id || robloxData.data.Id === '') return message.channel.send(`I could not find a Roblox user with the name of ${args[0]}.`)
      try {
        await banStore.save({ key: banStore.key(['bans']), data: { roblox_id: robloxData.data.Id, banned: true, hidden_from_leaderboards: false, radio_disabled: false, radio_disabled_until: null } })
      } catch (e) {
        message.channel.send('There was an error when creating the entity!')
        return console.error(e)
      }
      await message.channel.send(`${robloxData.data.Username} successfully banned from the game!`)
    } else if (!args[0]) {
      return message.reply('You did not provide a username!')
    } else if (!reason) {
      return message.reply('You did not provide a reason!')
    }
  }
}
