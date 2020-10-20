const fs = require('fs')
const request = require('axios')
const { banFilesPath, bucket, gameModeratorRole, gameModeratorUsers, serviceKeyPath } = require('../config.json')
const {Storage} = require('@google-cloud/storage')
const storage = new Storage({keyFilename: serviceKeyPath})
module.exports = {
    name: 'gameban',
    description: 'Bans user from game',
    guildOnly: true,
    execute(message, args) {
        if (gameModeratorUsers.includes(message.author.id) || message.members.roles.cache.some(role => gameModeratorRole.includes(role.id))) {
            let reason = args.slice(1).join(" ")
            if ((args[0]) && (reason)) {
                request(`https://api.roblox.com/users/get-by-username?username=${args[0]}`)
                .then(function (response) {
                    if ((!response.data.Id) || (response.data.Id == '')) {
                        return message.reply(`I could not find a Roblox user with the name of ${args[0]}`)
                    }
                    else {
                        fs.writeFileSync(`${banFilesPath}\\${response.data.Id}.json`, `{"usercode":"0x2","reason":"${reason}"}`, function (err) {
                            if (err) return message.reply(err)
                        })
                        async function uploadFile() {
                            await storage.bucket(bucket).upload(`${banFilesPath}\\${response.data.Id}.json`)
                        }
                        uploadFile()
                        uploadFile().catch(e => {
                            console.log(e)
                            return message.channel.send(`Error returned by Google!: ${e}`)
                        })
                        return message.reply(`${response.data.Username} was banned from the game!`)
                    }
                })
                .catch(function (error) {
                    console.error(error)
                    return message.channel.send('An unexpected error occured when finding the user.')
                })
            }
            else if (!args[0]) {
                return message.reply('You did not provide a username!')
            }
            else if (!reason) {
                return message.reply('You did not provide a reason!')
            }
        }
        else {
            return message.channel.send('You do not have permission to use this command!')
        }
    }
}