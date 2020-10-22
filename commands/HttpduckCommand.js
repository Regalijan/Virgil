const Discord = require('discord.js')
const request = require('axios')

module.exports = {
    name: "httpduck",
    description: "Gets a duck with the specified http status code if one exists",
    execute(message, args) {
        request(`https://random-d.uk/api/v2/http/${args[0]}`)
        .then(duck => {
            if (duck.status !=200) return message.channel.send('I could not find a duck with that status code.')
            const embed = new Discord.MessageEmbed()
            .setTitle(`${args[0]} Duck`)
            .setImage(`https://random-d.uk/api/v2/http/${args[0]}`)
            .setColor(3756250)
            return message.channel.send(embed)
        })
        .catch(e => console.error(e.stack))
    }
}