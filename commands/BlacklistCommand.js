const fs = require('fs')
const request = require('axios')
const { bucket, gameModeratorRole, gameModeratorUsers, serviceKeyPath } = require('../config.json')
const { Storage } = require('@google-cloud/storage')
const storage = new Storage({ keyFilename: serviceKeyPath })
module.exports = {
  name: 'blacklist',
  description: 'Blacklists user from game',
  guildOnly: true,
  async execute (message, args) {
    if (gameModeratorUsers.includes(message.author.id) || message.member.roles.cache.some(role => gameModeratorRole.includes(role.id))) {
      if (args[0]) {
        const robloxData = await request(`https://api.roblox.com/users/get-by-username?username=${args[0]}`).catch(e => {
          console.error(e)
          return message.channel.send(`An error occured when looking up this user! ${e}`)
        })
        if (!robloxData.data.Id || robloxData.data.Id === '') return message.channel.send(`I could not find a Roblox user with the name of ${args[0]}`)
        try {
          fs.writeFileSync(`./${robloxData.data.Id}.json`, '{"usercode":"0x1"}')
        } catch (e) {
          message.channel.send('An error occured when writing the file!')
        }
        try {
          await storage.bucket(bucket).upload(`./${robloxData.data.Id}.json`)
          const viewcheck = await request(`https://storage.googleapis.com/${bucket}/${robloxData.data.Id}.json`, { validateStatus: false })
          if (viewcheck.status === 403) await storage.bucket(bucket).file(`${robloxData.data.id}.json`).makePublic()
        } catch (e) {
          message.channel.send(`An error occured! ${e}`)
          return console.error(e)
        }
        await message.channel.send(`${robloxData.data.Username} successfully blacklisted!`).then(() => {
          fs.unlink(`./${robloxData.data.Id}.json`, err => { if (err) return console.error(err) })
        })
      } else {
        return message.reply('You did not provide a username!')
      }
    } else {
      return message.channel.send('You do not have permission to use this command!')
    }
  }
}
