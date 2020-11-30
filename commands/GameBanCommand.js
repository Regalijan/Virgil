const fs = require('fs')
const request = require('axios')
const { bucket, gameModeratorRole, gameModeratorUsers, serviceKeyPath } = require('../config.json')
const { Storage } = require('@google-cloud/storage')
const storage = new Storage({ keyFilename: serviceKeyPath })
module.exports = {
  name: 'gameban',
  description: 'Bans user from game',
  guildOnly: true,
  async execute (message, args) {
    if (gameModeratorUsers.includes(message.author.id) || message.members.roles.cache.some(role => gameModeratorRole.includes(role.id))) {
      const reason = args.slice(1).join(' ')
      if ((args[0]) && (reason)) {
        const robloxData = await request(`https://api.roblox.com/users/get-by-username?username=${args[0]}`).catch(e => {
          console.error(e)
          return message.channel.send(`An error occured when looking up this user! ${e}`)
        })
        if (!robloxData.data.Id || robloxData.data.Id == '') return message.channel.send(`I could not find a Roblox user with the name of ${args[0]}.`)
        fs.writeFile(`./${robloxData.data.Id}.json`, `{"usercode":"0x2","reason":"${reason}"}`, err => {
          if (err) {
            console.error(err)
            return message.channel.send('An error occured when writing the file!')
          }
        })
        await storage.bucket(bucket).upload(`./${robloxData.data.Id}.json`).catch(e => {
          console.error(e)
          return message.channel.send(`An error occured when uploading the file! ${e}`)
        })
        const filecheck = await request(`https://storage.googleapis.com/${bucket}/${robloxData.data.Id}.json`, { validateStatus: false }).catch(e => {
          console.error(e)
          return message.channel.send(`An error occured when checking the file! ${e}`)
        })
        if (filecheck.status == 403) {
          await storage.bucket(bucket).file(`${robloxData.data.Id}.json`).makePublic().catch(e => {
            console.error(e)
            return message.channel.send(`An error occured when making the file public! ${e}`)
          })
        }
        message.channel.send(`${robloxData.data.Username} successfully banned from the game!`)
        fs.unlink(`./${robloxData.data.Id}.json`, e => console.error(e))
      } else if (!args[0]) {
        return message.reply('You did not provide a username!')
      } else if (!reason) {
        return message.reply('You did not provide a reason!')
      }
    } else {
      return message.channel.send('You do not have permission to use this command!')
    }
  }
}
