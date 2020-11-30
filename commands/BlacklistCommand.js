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
        if (!robloxData.data.Id || robloxData.data.Id == '') return message.channel.send(`I could not find a Roblox user with the name of ${args[0]}`)
        fs.writeFile(`./${robloxData.data.Id}.json`, '{"usercode":"0x1"}', err => {
          if (err) {
            console.error(err)
            return message.channel.send(`An error occured when writing the file! ${e}`)
          }
        })
        await storage.bucket(bucket).upload(`./${robloxData.data.Id}.json`).catch(e => {
          console.error(e)
          return message.channel.send(`Error returned by Google: ${e}`)
        })
        const viewcheck = await request(`https://storage.googleapis.com/${bucket}/${robloxData.data.Id}`, { validateStatus: false })
        if (viewcheck.status == 403) {
          await storage.bucket(bucket).file(`${robloxData.data.id}.json`).makePublic().catch(e => {
            console.error(e)
            return message.channel.send(`An error occured when making the file public! ${e}`)
          })
        }
        message.channel.send(`${robloxData.data.Username} successfully blacklisted!`)
        fs.unlink(`./${robloxData.data.Id}.json`, err => console.error(err))
      } else {
        return message.reply('You did not provide a username!')
      }
    } else {
      return message.channel.send('You do not have permission to use this command!')
    }
  }
}
