const fs = require('fs')
const request = require('axios')
const { banFilesPath, bucket, gameModeratorRole, gameModeratorUsers, serviceKeyPath } = require('../config.json')
const {Storage} = require('@google-cloud/storage')
const storage = new Storage({keyFilename: serviceKeyPath})
module.exports = {
    name: 'blacklist',
    description: 'Blacklists user from game',
    guildOnly: true,
    execute(message, args) {
        let errormessage = undefined
        if (gameModeratorUsers.includes(message.author.id) || message.members.roles.cache.some(role => gameModeratorRole.includes(role.id))) {
            if (args[0]) {
                request(`https://api.roblox.com/users/get-by-username?username=${args[0]}`)
                .then(function (response) {
                    if ((!response.data.Id) || (response.data.Id == '')) {
                        return message.reply(`I could not find a Roblox user with the name of ${args[0]}`)
                    }
                    else {
                        fs.writeFileSync(`${banFilesPath}\\${response.data.Id}.json`, `{"usercode":"0x1"}`, function (err) {
                            if (err) return errormessage = err
                        })
                        async function uploadFile() {
                            await storage.bucket(bucket).upload(`${banFilesPath}\\${response.data.Id}.json`)
                        }
                        if (!errormessage) {
                            uploadFile()
                            uploadFile().catch(e => {
                                console.log(e)
                                return errormessage = `Error returned by Google!: ${e}`
                            })
                            if(errormessage) return errormessage
                        }
                        if (!errormessage) {
                            return message.reply(`${response.data.Username} was blacklisted!`)
                        }
                        else {
                            return message.channel.send(errormessage)
                        }
                    }
                })
                .catch(function (error) {
                    console.error(error)
                    return message.channel.send('An unexpected error occured when finding the user.')
                })
            }
            else {
                return message.reply('You did not provide a username!')
            }
        }
        else {
            return message.channel.send('You do not have permission to use this command!')
        }
    }
}