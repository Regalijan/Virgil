module.exports = {
  name: 'blacklist',
  properName: 'Blacklist',
  description: 'Blacklists user from game',
  guildOnly: true,
  async execute (message, args) {
    const db = require('../database')
    const usermodcheck = await db.query('SELECT * FROM gamemods WHERE id = $1 AND type = \'user\' AND guild = $2;', [message.author.id, message.guild.id])
    const modroles = await db.query('SELECT * FROM gamemods WHERE guild = $1 AND type = \'role\';', [message.guild.id])
    const roles = []
    modroles.rows.forEach(row => roles.push(row.id))
    if (usermodcheck.rowCount === 0 && !message.members.roles.cache.some(role => roles.includes(role.id))) return
    const modsettings = await db.query('SELECT * FROM gamemod_settings WHERE guild = $1;', [message.guild.id])
    if (modsettings.rowCount === 0) return
    const { Storage } = require('@google-cloud/storage')
    const storage = new Storage({ keyFilename: `./servicekeys/${message.guild.id}.json` })
    const { Datastore } = require('@google-cloud/datastore')
    const banStore = new Datastore({ keyFilename: './servicekeys/banstore.json' })
    const fs = require('fs/promises')
    const request = require('axios')
    if (args[0]) {
      const robloxData = await request(`https://api.roblox.com/users/get-by-username?username=${args[0]}`).catch(e => {
        console.error(e)
        return message.channel.send(`An error occured when looking up this user! ${e}`)
      })
      if (!robloxData.data.Id || robloxData.data.Id === '') return message.channel.send(`I could not find a Roblox user with the name of ${args[0]}`)
      try {
        await banStore.save({ key: banStore.key(['bans']), data: { roblox_id: robloxData.data.Id, banned: false, hidden_from_leaderboards: true, radio_disabled: false, radio_disabled_until: null } })
        await fs.writeFile(`./${robloxData.data.Id}.json`, '{"usercode":"0x1"}')
      } catch (e) {
        message.channel.send('An error occured when writing the file!')
      }
      try {
        await storage.bucket(modsettings.rows[0].bucket).upload(`./${robloxData.data.Id}.json`)
        const viewcheck = await request(`https://storage.googleapis.com/${modsettings.rows[0].bucket}/${robloxData.data.Id}.json`, { validateStatus: false })
        if (viewcheck.status === 403 && modsettings.rows[0].files_are_public) await storage.bucket(modsettings.rows[0].bucket).file(`${robloxData.data.id}.json`).makePublic()
      } catch (e) {
        message.channel.send(`An error occured! ${e}`)
        return console.error(e)
      }
      await message.channel.send(`${robloxData.data.Username} successfully blacklisted!`)
      await fs.unlink(`./${robloxData.data.Id}.json`, err => { if (err) return console.error(err) })
    } else {
      return message.reply('You did not provide a username!')
    }
  }
}
