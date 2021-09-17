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
    const fs = require('fs/promises')
    const request = require('axios')
    const { Storage } = require('@google-cloud/storage')
    const storage = new Storage({ keyFilename: `./servicekeys/${message.guild.id}.json` })
    const { Datastore } = require('@google-cloud/datastore')
    const banStore = new Datastore({ keyFilename: './servicekeys/banstore.json' }) // This is temporary while the ban system is migrated as both are needed for the time being
    const reason = args.slice(1).join(' ')
    if ((args[0]) && (reason)) {
      const robloxData = await request(`https://api.roblox.com/users/get-by-username?username=${args[0]}`).catch(e => {
        console.error(e)
        return message.channel.send(`An error occured when looking up this user! ${e}`)
      })
      if (!robloxData.data.Id || robloxData.data.Id === '') return message.channel.send(`I could not find a Roblox user with the name of ${args[0]}.`)
      try {
        await banStore.save({ key: banStore.key(['bans']), data: { roblox_id: robloxData.data.Id, banned: true, hidden_from_leaderboards: false, radio_disabled: false, radio_disabled_until: null } })
        await fs.writeFile(`./${robloxData.data.Id}.json`, `{"usercode":"0x2","reason":"${reason}"}`)
      } catch (e) {
        message.channel.send('There was an error writing the file!')
        return console.error(e)
      }
      await storage.bucket(modsettings.rows[0].bucket).upload(`./${robloxData.data.Id}.json`).catch(e => {
        console.error(e)
        return message.channel.send(`An error occured when uploading the file! ${e}`)
      })
      const filecheck = await request(`https://storage.googleapis.com/${modsettings.rows[0].bucket}/${robloxData.data.Id}.json`, { validateStatus: false }).catch(e => {
        console.error(e)
        return message.channel.send(`An error occured when checking the file! ${e}`)
      })
      if (filecheck.status === 403 && modsettings.rows[0].files_are_public) {
        await storage.bucket(modsettings.rows[0].bucket).file(`${robloxData.data.Id}.json`).makePublic().catch(e => {
          console.error(e)
          return message.channel.send(`An error occured when making the file public! ${e}`)
        })
      }
      await message.channel.send(`${robloxData.data.Username} successfully banned from the game!`)
      await fs.unlink(`./${robloxData.data.Id}.json`, e => { if (e) console.error(e) })
    } else if (!args[0]) {
      return message.reply('You did not provide a username!')
    } else if (!reason) {
      return message.reply('You did not provide a reason!')
    }
  }
}
